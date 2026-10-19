# Origin: pptx2html/htmlir/reconcile.py::_restore_structural_fallback_metadata
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, CanonicalHtmlRenderer, _CANONICAL_FRAGMENT_PATTERN, copy, presentation_from_dict
from doe_export.html.reconcile.document._iter_shape_dicts_with_keys import _iter_shape_dicts_with_keys
from doe_export.html.reconcile.identity._normalize_new_shape_ids import _normalize_new_shape_ids
from doe_export.html.reconcile.identity._semantic_shape_identity import _semantic_shape_identity
from doe_export.html.reconcile.identity._shape_ids import _shape_ids
from doe_export.html.reconcile.identity._stable_element_records import _stable_element_records
from doe_export.html.reconcile.metadata._strip_semantic_identity_diagnostics import _strip_semantic_identity_diagnostics

def _restore_structural_fallback_metadata(
    previous: dict[str, Any],
    semantic: dict[str, Any],
    editable_html: str,
) -> tuple[dict[str, Any], str | None]:
    """Merge a safe top-level add with unchanged source-backed IR shapes.

    The semantic compiler is allowed to author genuinely new elements. Existing
    source shapes are reused only when their complete stable subtree is byte
    equivalent after HTML token normalization. Group/ungroup, nested additions,
    mixed style edits, missing ids, or ambiguous identity mappings fail closed.
    """

    try:
        old_presentation = presentation_from_dict(copy.deepcopy(previous))
        canonical = CanonicalHtmlRenderer(mode="embedded").render(old_presentation)
    except (TypeError, ValueError):
        return semantic, "Previous Current IR could not be rendered for identity verification."
    fragment_match = _CANONICAL_FRAGMENT_PATTERN.search(canonical)
    if fragment_match is None:
        return semantic, "Previous Current IR produced no canonical slide fragment."
    old_records, old_duplicates = _stable_element_records(
        fragment_match.group("fragment").strip()
    )
    edited_records, edited_duplicates = _stable_element_records(editable_html.strip())
    if old_duplicates or edited_duplicates:
        return semantic, (
            "Stable element ids are duplicated, so source metadata cannot be "
            "bound to exactly one shape."
        )
    if not old_records:
        return semantic, "Previous Current IR contains no usable stable shape identities."

    old_ids = set(old_records)
    edited_ids = set(edited_records)
    common_ids = old_ids.intersection(edited_ids)
    added_ids = edited_ids.difference(old_ids)
    if not added_ids:
        return semantic, (
            "The structural edit changed source shape hierarchy or contains "
            "unidentified elements. Group/ungroup requires a dedicated native "
            "IR operation and is not accepted through semantic fallback."
        )
    for element_id in common_ids:
        old_record = old_records[element_id]
        edited_record = edited_records[element_id]
        if old_record.get("parent_id") != edited_record.get("parent_id"):
            return semantic, (
                f"Element '{element_id}' moved across a group boundary. "
                "Lossless group/ungroup reconciliation is not supported."
            )
        if old_record.get("fingerprint") != edited_record.get("fingerprint"):
            return semantic, (
                f"Element '{element_id}' was modified together with a structural "
                "addition. Split the content/style edit from the add operation "
                "so source metadata remains lossless."
            )
    for element_id in added_ids:
        parent_id = edited_records[element_id].get("parent_id")
        if parent_id in old_ids:
            return semantic, (
                f"New element '{element_id}' was inserted inside source element "
                f"'{parent_id}'. Nested additions require a native IR operation."
            )

    restored = copy.deepcopy(semantic)
    old_slides = previous.get("slides")
    new_slides = restored.get("slides")
    if (
        not isinstance(old_slides, list)
        or len(old_slides) != 1
        or not isinstance(old_slides[0], dict)
        or not isinstance(new_slides, list)
        or len(new_slides) != 1
        or not isinstance(new_slides[0], dict)
    ):
        return semantic, "Structural reconciliation requires exactly one source and result slide."
    old_slide = old_slides[0]
    new_slide = new_slides[0]
    old_shapes = old_slide.get("shapes")
    semantic_shapes = new_slide.get("shapes")
    if not isinstance(old_shapes, list) or not isinstance(semantic_shapes, list):
        return semantic, "Structural reconciliation received invalid shape collections."

    old_shape_by_key = {
        shape_key: shape
        for shape_key, shape, _parent_key in _iter_shape_dicts_with_keys(old_shapes)
    }
    semantic_by_top_identity: dict[str, list[dict[str, Any]]] = {}
    for shape in semantic_shapes:
        if not isinstance(shape, dict):
            continue
        identity = _semantic_shape_identity(shape)
        if identity is None or identity not in edited_records:
            return semantic, (
                "Semantic fallback produced an unbound shape. Every structural "
                "addition must carry a unique data-yrkie-element-id."
            )
        top_identity = identity
        while edited_records[top_identity].get("parent_id") is not None:
            parent_id = str(edited_records[top_identity]["parent_id"])
            if parent_id not in edited_records:
                return semantic, "Semantic shape identity has an invalid parent chain."
            top_identity = parent_id
        semantic_by_top_identity.setdefault(top_identity, []).append(shape)

    top_records = sorted(
        (
            record
            for record in edited_records.values()
            if record.get("parent_id") is None
        ),
        key=lambda item: int(item.get("order") or 0),
    )
    merged_shapes: list[dict[str, Any]] = []
    preserve_flags: list[bool] = []
    for record in top_records:
        element_id = str(record["element_id"])
        if element_id in old_records:
            raw_key = str(old_records[element_id].get("shape_key") or "")
            try:
                shape_key = int(raw_key)
            except (TypeError, ValueError):
                return semantic, (
                    f"Source element '{element_id}' has no unambiguous canonical "
                    "shape key."
                )
            old_shape = old_shape_by_key.get(shape_key)
            if old_shape is None:
                return semantic, f"Source element '{element_id}' no longer maps to Current IR."
            merged_shapes.append(copy.deepcopy(old_shape))
            preserve_flags.append(True)
            continue
        authored = semantic_by_top_identity.get(element_id) or []
        if not authored:
            return semantic, (
                f"New element '{element_id}' produced no editable semantic IR shape."
            )
        authored_copies = copy.deepcopy(authored)
        merged_shapes.extend(authored_copies)
        preserve_flags.extend([False] * len(authored_copies))

    retained_ids = {
        shape_id
        for shape in merged_shapes
        for shape_id in _shape_ids(shape)
    }
    next_shape_id = max(retained_ids, default=0) + 1
    seen_ids: set[int] = set()
    for shape, preserve_existing in zip(
        merged_shapes,
        preserve_flags,
        strict=True,
    ):
        next_shape_id = _normalize_new_shape_ids(
            shape,
            old_ids=retained_ids,
            seen_ids=seen_ids,
            next_shape_id=next_shape_id,
            preserve_existing=preserve_existing,
        )
        _strip_semantic_identity_diagnostics(shape)

    new_slide["shapes"] = merged_shapes
    for key, value in old_slide.items():
        if key not in new_slide and key != "shapes":
            new_slide[key] = copy.deepcopy(value)
    for key in ("name", "show", "background", "transition"):
        if key in old_slide:
            new_slide[key] = copy.deepcopy(old_slide[key])
    retained_ids = {
        shape_id
        for shape in merged_shapes
        for shape_id in _shape_ids(shape)
    }
    animations = old_slide.get("animations")
    if isinstance(animations, list):
        new_slide["animations"] = [
            copy.deepcopy(animation)
            for animation in animations
            if not isinstance(animation, dict)
            or animation.get("target_shape_id") is None
            or animation.get("target_shape_id") in retained_ids
        ]
    for key, value in previous.items():
        if key not in restored and key != "slides":
            restored[key] = copy.deepcopy(value)
    if "embedded_fonts" in previous:
        restored["embedded_fonts"] = copy.deepcopy(previous["embedded_fonts"])
    return restored, None

_restore_structural_fallback_metadata.__module__ = 'pptx2html.htmlir.reconcile'
