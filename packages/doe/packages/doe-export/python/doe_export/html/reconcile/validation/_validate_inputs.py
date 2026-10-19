# Origin: pptx2html/htmlir/reconcile.py::_validate_inputs
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, _CANONICAL_MARKER_PATTERN, presentation_from_dict
from doe_export.html.reconcile.validation._EditableHtmlAssetGuard import _EditableHtmlAssetGuard
from doe_export.html.reconcile.validation._current_ir_contains_inline_binary import _current_ir_contains_inline_binary

def _validate_inputs(
    editable_html: str,
    previous_current_ir: dict[str, Any],
    *,
    slide_index: int,
    viewport: tuple[int, int],
    timeout_ms: int,
    max_dom_nodes: int,
) -> tuple[str, str] | None:
    if not isinstance(editable_html, str) or not editable_html.strip():
        return "slide-reconcile-empty-html", "editable_html must be a non-empty string."
    if not isinstance(previous_current_ir, dict):
        return "slide-reconcile-invalid-ir", "previous_current_ir must be an object."
    if not isinstance(slide_index, int) or isinstance(slide_index, bool) or slide_index < 0:
        return "slide-reconcile-invalid-slide-index", "slide_index must be a non-negative integer."
    if (
        not isinstance(viewport, (tuple, list))
        or len(viewport) != 2
        or any(
            not isinstance(value, int)
            or isinstance(value, bool)
            or value <= 0
            for value in viewport
        )
    ):
        return "slide-reconcile-invalid-viewport", "viewport must contain two positive integers."
    if not isinstance(timeout_ms, int) or isinstance(timeout_ms, bool) or timeout_ms <= 0:
        return "slide-reconcile-invalid-timeout", "timeout_ms must be a positive integer."
    if (
        not isinstance(max_dom_nodes, int)
        or isinstance(max_dom_nodes, bool)
        or max_dom_nodes <= 0
    ):
        return (
            "slide-reconcile-invalid-dom-budget",
            "max_dom_nodes must be a positive integer.",
        )
    if _CANONICAL_MARKER_PATTERN.search(editable_html):
        return (
            "slide-reconcile-forbidden-canonical-marker",
            "editable_html must not contain Canonical slide boundary comments.",
        )

    guard = _EditableHtmlAssetGuard()
    try:
        guard.feed(editable_html)
        guard.close()
    except Exception:
        return "slide-reconcile-invalid-html", "editable_html could not be parsed."
    if guard.has_script:
        return (
            "slide-reconcile-active-content",
            "editable_html cannot contain script elements.",
        )
    if guard.has_inline_data_url:
        return (
            "slide-reconcile-inline-asset",
            "editable_html must reference presentation assets and cannot inline data URLs.",
        )
    if _current_ir_contains_inline_binary(previous_current_ir):
        return (
            "slide-reconcile-inline-ir-asset",
            (
                "previous_current_ir contains inline binary content; externalize "
                "it to yrkie-asset-* references before reconciliation."
            ),
        )
    try:
        presentation = presentation_from_dict(previous_current_ir)
    except (TypeError, ValueError):
        return "slide-reconcile-invalid-ir", "previous_current_ir is not valid Presentation IR."
    if len(presentation.slides) != 1:
        return (
            "slide-reconcile-slide-count",
            "previous_current_ir must contain exactly one slide.",
        )
    return None

_validate_inputs.__module__ = 'pptx2html.htmlir.reconcile'
