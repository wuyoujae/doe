# Origin: pptx_pipeline.py::parse_html_to_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import compile_html

def parse_html_to_ir(
    html: str,
    *,
    slide_index: int = 0,
    include_ast: bool = False,
    include_browser_screenshot: bool = False,
    base_url: str | None = None,
    root_selector: str | None = None,
    viewport: tuple[int, int] = (1280, 720),
    timeout_ms: int = 20000,
    max_dom_nodes: int = 5000,
    render_mode: str = "semantic",
) -> dict[str, Any]:
    """Parse ordinary HTML/CSS into editable PresentationIR."""

    return compile_html(
        html,
        slide_index=slide_index,
        include_ast=include_ast,
        include_browser_screenshot=include_browser_screenshot,
        base_url=base_url,
        root_selector=root_selector,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
        render_mode=render_mode,
    )

parse_html_to_ir.__module__ = 'pptx_pipeline'
