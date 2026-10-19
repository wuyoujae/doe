# Origin: pptx2html/htmlir/compiler.py::compile_slide_fragment
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import DEFAULT_MAX_DOM_NODES, DEFAULT_TIMEOUT_MS
from doe_export.html.compiler.diagnostics._append_escaped_markup_diagnostic import _append_escaped_markup_diagnostic
from doe_export.html.compiler.diagnostics._append_truncated_canonical_payload_diagnostic import _append_truncated_canonical_payload_diagnostic
from doe_export.html.compiler.document._close_truncated_canonical_payload import _close_truncated_canonical_payload
from doe_export.html.compiler.browser._compile_browser_snapshot import _compile_browser_snapshot
from doe_export.html.compiler.document._normalize_serialized_html_source import _normalize_serialized_html_source
from doe_export.html.compiler.document._normalize_viewport import _normalize_viewport
from doe_export.html.compiler.browser._run_browser_snapshot import _run_browser_snapshot
from doe_export.html.compiler.document._validate_source_and_mode import _validate_source_and_mode

def compile_slide_fragment(
    fragment: str,
    slide_index: int = 0,
    include_ast: bool = False,
    include_browser_screenshot: bool = True,
    base_url: str | None = None,
    viewport: tuple[int, int] = (1920, 1080),
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    max_dom_nodes: int = DEFAULT_MAX_DOM_NODES,
    render_mode: str = "semantic",
    require_editable_coverage: bool = False,
) -> dict[str, Any]:
    """Compile one Slide Agent HTML fragment inside the platform compiler shell."""

    fragment, escaped_markup_recovered = _normalize_serialized_html_source(fragment)
    fragment, truncated_payload_recovered = _close_truncated_canonical_payload(fragment)
    _validate_source_and_mode(fragment, render_mode)
    viewport = _normalize_viewport(viewport)
    render_mode = str(render_mode or "semantic").strip().lower()
    snapshot = _run_browser_snapshot(
        source=fragment,
        base_url=base_url,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
        fragment=True,
    )
    return _append_truncated_canonical_payload_diagnostic(
        _append_escaped_markup_diagnostic(
            _compile_browser_snapshot(
                snapshot,
                slide_index=slide_index,
                include_ast=include_ast,
                include_browser_screenshot=include_browser_screenshot,
                viewport=viewport,
                render_mode=render_mode,
                require_editable_coverage=require_editable_coverage,
            ),
            escaped_markup_recovered,
        ),
        truncated_payload_recovered,
    )

compile_slide_fragment.__module__ = 'pptx2html.htmlir.compiler'
