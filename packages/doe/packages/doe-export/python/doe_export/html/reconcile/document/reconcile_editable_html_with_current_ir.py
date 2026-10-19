# Origin: pptx2html/htmlir/reconcile.py::reconcile_editable_html_with_current_ir
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, HtmlCompileError, _STABLE_RECONCILE_DIAGNOSTICS, compile_html, copy
from doe_export.html.reconcile.document._build_ephemeral_canonical_html import _build_ephemeral_canonical_html
from doe_export.html.reconcile.diagnostics._diagnostic import _diagnostic
from doe_export.html.reconcile.assets._embedded_fonts_use_managed_references import _embedded_fonts_use_managed_references
from doe_export.html.reconcile.diagnostics._failure import _failure
from doe_export.html.reconcile.metadata._restore_composed_picture_metadata import _restore_composed_picture_metadata
from doe_export.html.reconcile.metadata._restore_structural_fallback_metadata import _restore_structural_fallback_metadata
from doe_export.html.reconcile.metadata._restore_unknown_metadata import _restore_unknown_metadata
from doe_export.html.reconcile.validation._validate_inputs import _validate_inputs

def reconcile_editable_html_with_current_ir(
    editable_html: str,
    previous_current_ir: dict[str, Any],
    *,
    slide_index: int = 0,
    viewport: tuple[int, int] = (1280, 720),
    timeout_ms: int = 20_000,
    max_dom_nodes: int = 5_000,
    asset_payloads: dict[str, Any] | None = None,
    browser_asset_overrides: dict[str, str] | None = None,
    browser_asset_suppressions: list[str] | None = None,
) -> dict[str, Any]:
    """Compile edited pure HTML while preserving trusted Current IR metadata.

    Stable canonical shape identities are merged through the existing
    ``_reconcile_canonical_presentation`` path used by ``compile_html``.  If the
    visible shape set changes, the existing canonical compiler deliberately
    rebuilds the page semantically and this helper reports that downgrade
    explicitly.

    The ephemeral Canonical document never leaves this function. Both persisted
    inputs must use ``yrkie-asset-*`` references instead of inline binaries.
    ``asset_payloads`` is a transient, bounded content-addressed map used only
    to materialize those references for the browser compiler.
    """

    validation_error = _validate_inputs(
        editable_html,
        previous_current_ir,
        slide_index=slide_index,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
    )
    if validation_error is not None:
        return _failure(validation_error[0], validation_error[1])

    try:
        ephemeral = _build_ephemeral_canonical_html(
            editable_html,
            previous_current_ir,
            asset_payloads=asset_payloads,
            browser_asset_overrides=browser_asset_overrides,
            browser_asset_suppressions=browser_asset_suppressions,
        )
        compiled = compile_html(
            ephemeral,
            slide_index=slide_index,
            include_ast=False,
            include_browser_screenshot=False,
            viewport=viewport,
            timeout_ms=timeout_ms,
            max_dom_nodes=max_dom_nodes,
            render_mode="semantic",
        )
    except HtmlCompileError as error:
        return {
            "success": False,
            "presentation": None,
            "diagnostics": [item.to_dict() for item in error.diagnostics],
            "reconcile_mode": "semantic-fallback",
        }
    except (TypeError, ValueError) as error:
        return _failure("slide-reconcile-invalid-input", str(error))

    diagnostics = [
        item
        for item in compiled.get("diagnostics", [])
        if isinstance(item, dict)
    ]
    diagnostic_codes = {
        str(item.get("code") or "")
        for item in diagnostics
    }
    stable_merge = bool(diagnostic_codes.intersection(_STABLE_RECONCILE_DIAGNOSTICS))
    presentation = compiled.get("presentation")
    if not isinstance(presentation, dict):
        return _failure(
            "slide-reconcile-missing-presentation",
            "HTML reconciliation completed without a Presentation IR result.",
        )

    if stable_merge:
        presentation = _restore_unknown_metadata(previous_current_ir, presentation)
        presentation = _restore_composed_picture_metadata(
            previous_current_ir,
            presentation,
            asset_payloads or {},
        )
        diagnostics.insert(
            0,
            _diagnostic(
                "info",
                "slide-ir-stable-id-merge",
                (
                    "Merged editable HTML into Current IR by stable canonical "
                    "shape identity while preserving source-only metadata."
                ),
            ),
        )
        reconcile_mode = "stable-id-merge"
    else:
        presentation, structural_error = _restore_structural_fallback_metadata(
            previous_current_ir,
            presentation,
            editable_html,
        )
        if structural_error is not None:
            return _failure(
                "slide-structure-lossless-unsupported",
                structural_error,
            )
        diagnostics.insert(
            0,
            _diagnostic(
                "info",
                "slide-structure-semantic-fallback-preserved",
                (
                    "Compiled newly added stable elements semantically, while "
                    "restoring unchanged source-backed shapes and slide metadata "
                    "by verified stable identity."
                ),
            ),
        )
        reconcile_mode = "semantic-fallback"

    # Browser font variants are an ephemeral delivery concern. They must never
    # replace the original font identities that Current IR keeps for native
    # source-backed PPTX export.
    if _embedded_fonts_use_managed_references(previous_current_ir):
        presentation["embedded_fonts"] = copy.deepcopy(
            previous_current_ir["embedded_fonts"]
        )

    return {
        "success": True,
        "presentation": presentation,
        "diagnostics": diagnostics,
        "reconcile_mode": reconcile_mode,
    }

reconcile_editable_html_with_current_ir.__module__ = 'pptx2html.htmlir.reconcile'
