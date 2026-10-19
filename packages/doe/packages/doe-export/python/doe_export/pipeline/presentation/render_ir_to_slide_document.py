# Origin: pptx_pipeline.py::render_ir_to_slide_document
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import copy
from doe_export.pipeline.assets._assert_no_inline_binary_ir import _assert_no_inline_binary_ir
from doe_export.pipeline.canonical._current_ir_storage_sha256 import _current_ir_storage_sha256
from doe_export.pipeline.presentation._embedded_fonts_use_managed_references import _embedded_fonts_use_managed_references
from doe_export.pipeline.canonical._restore_unknown_ir_metadata import _restore_unknown_ir_metadata
from doe_export.pipeline.html.extract_editable_slide_html import extract_editable_slide_html
from doe_export.pipeline.canonical.render_ir_to_canonical import render_ir_to_canonical

def render_ir_to_slide_document(
    presentation_ir: dict[str, Any],
    known_asset_ids: set[str] | None = None,
    *,
    normalize_text_layout: bool = False,
    include_canonical_html: bool = False,
    asset_payloads: dict[str, Any] | None = None,
    browser_asset_overrides: dict[str, str] | None = None,
    browser_asset_suppressions: list[str] | None = None,
) -> dict[str, Any]:
    """Materialize a V2 Slide document from one Current IR.

    Pure editable HTML and externalized Current IR are always returned.
    Self-contained Canonical HTML remains available only when explicitly
    requested for compatibility, debug, or HTML Out.
    """

    if not isinstance(include_canonical_html, bool):
        raise ValueError("include_canonical_html must be a boolean.")
    canonical = render_ir_to_canonical(
        presentation_ir,
        known_asset_ids,
        normalize_text_layout=normalize_text_layout,
        asset_payloads=asset_payloads,
        browser_asset_overrides=browser_asset_overrides,
        browser_asset_suppressions=browser_asset_suppressions,
    )
    known_after_render = set(known_asset_ids or ())
    known_after_render.update((asset_payloads or {}).keys())
    known_after_render.update(
        str(asset.get("asset_id"))
        for asset in canonical["assets"]
        if isinstance(asset, dict) and asset.get("asset_id")
    )
    extracted = extract_editable_slide_html(
        canonical["html"],
        known_asset_ids=known_after_render,
        asset_payloads=asset_payloads,
    )
    if not extracted.get("canonical_ir_valid"):
        raise ValueError("Rendered Canonical HTML did not contain a valid Current IR.")

    current_ir = _restore_unknown_ir_metadata(
        presentation_ir,
        extracted["current_ir"],
    )
    if _embedded_fonts_use_managed_references(presentation_ir):
        current_ir["embedded_fonts"] = copy.deepcopy(
            presentation_ir["embedded_fonts"]
        )
    _assert_no_inline_binary_ir(current_ir)
    result = {
        "success": True,
        "editable_html": extracted["editable_html"],
        "editable_html_sha256": extracted["editable_html_sha256"],
        "current_ir": current_ir,
        "current_ir_sha256": _current_ir_storage_sha256(current_ir),
        "assets": canonical["assets"],
        "resource_diagnostics": canonical.get("resource_diagnostics") or [],
    }
    for field in (
        "text_layout_normalized",
        "normalized_text_frame_count",
        "unresolved_text_frame_count",
    ):
        if field in canonical:
            result[field] = canonical[field]
    if include_canonical_html:
        result.update(
            {
                "canonical_html": canonical["html"],
                "canonical_html_sha256": canonical["content_hash"],
            }
        )
    return result

render_ir_to_slide_document.__module__ = 'pptx_pipeline'
