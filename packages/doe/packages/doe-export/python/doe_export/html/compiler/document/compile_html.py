# Origin: pptx2html/htmlir/compiler.py::compile_html
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import DEFAULT_MAX_DOM_NODES, DEFAULT_TIMEOUT_MS, DEFAULT_VIEWPORT
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.diagnostics._append_escaped_markup_diagnostic import _append_escaped_markup_diagnostic
from doe_export.html.compiler.diagnostics._append_truncated_canonical_payload_diagnostic import _append_truncated_canonical_payload_diagnostic
from doe_export.html.compiler.document._close_truncated_canonical_payload import _close_truncated_canonical_payload
from doe_export.html.compiler.browser._compile_browser_snapshot import _compile_browser_snapshot
from doe_export.html.compiler.document._compile_canonical_html import _compile_canonical_html
from doe_export.html.compiler.document._is_canonical_html import _is_canonical_html
from doe_export.html.compiler.document._normalize_serialized_html_source import _normalize_serialized_html_source
from doe_export.html.compiler.document._normalize_viewport import _normalize_viewport
from doe_export.html.compiler.browser._run_browser_snapshot import _run_browser_snapshot

def compile_html(
    source: str,
    slide_index: int = 0,
    include_ast: bool = True,
    include_browser_screenshot: bool = False,
    base_url: str | None = None,
    root_selector: str | None = None,
    viewport: tuple[int, int] = DEFAULT_VIEWPORT,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    max_dom_nodes: int = DEFAULT_MAX_DOM_NODES,
    render_mode: str = "semantic",
    require_editable_coverage: bool = False,
) -> dict[str, Any]:
    """Compile ordinary HTML/CSS into one slide of PresentationIR.

    Chromium computes real DOM, CSS cascade, layout boxes, and raster output.
    The default ``semantic`` mode maps visible DOM boxes into editable IR text,
    picture, and shape objects. ``snapshot`` mode remains available as a visual
    fallback that emits one full-slide picture shape.
    """

    if not isinstance(source, str) or not source.strip():
        raise HtmlCompileError(
            "Expected non-empty html string",
            [HtmlDiagnostic("error", "empty-source", "Expected non-empty html string.")],
        )

    source, escaped_markup_recovered = _normalize_serialized_html_source(source)
    source, truncated_payload_recovered = _close_truncated_canonical_payload(source)

    viewport = _normalize_viewport(viewport)
    render_mode = str(render_mode or "semantic").strip().lower()
    if render_mode not in {"semantic", "snapshot"}:
        raise HtmlCompileError(
            "Unsupported html render_mode",
            [
                HtmlDiagnostic(
                    "error",
                    "unsupported-render-mode",
                    f"Unsupported render_mode '{render_mode}'. Expected 'semantic' or 'snapshot'.",
                )
            ],
        )
    if render_mode == "semantic" and _is_canonical_html(source):
        return _append_truncated_canonical_payload_diagnostic(
            _append_escaped_markup_diagnostic(
                _compile_canonical_html(
                    source=source,
                    slide_index=slide_index,
                    include_ast=include_ast,
                    include_browser_screenshot=include_browser_screenshot,
                    base_url=base_url,
                    viewport=viewport,
                    timeout_ms=timeout_ms,
                    max_dom_nodes=max_dom_nodes,
                    force_browser_validation=(
                        escaped_markup_recovered or truncated_payload_recovered
                    ),
                ),
                escaped_markup_recovered,
            ),
            truncated_payload_recovered,
        )
    snapshot = _run_browser_snapshot(
        source=source,
        base_url=base_url,
        root_selector=root_selector,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
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

compile_html.__module__ = 'pptx2html.htmlir.compiler'
