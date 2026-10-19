# Origin: pptx_pipeline.py::html_to_pptx
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import Path
from doe_export.pipeline.pptx.export_ir_to_pptx import export_ir_to_pptx
from doe_export.pipeline.html.parse_html_to_ir import parse_html_to_ir

def html_to_pptx(
    html: str,
    *,
    output_path: str | Path | None = None,
    slide_index: int = 0,
    include_ast: bool = False,
    include_browser_screenshot: bool = False,
    base_url: str | None = None,
    viewport: tuple[int, int] = (1280, 720),
    timeout_ms: int = 20000,
    max_dom_nodes: int = 5000,
    render_mode: str = "semantic",
) -> dict[str, Any]:
    """Parse HTML/CSS to PresentationIR and export the result to PPTX."""

    compile_result = parse_html_to_ir(
        html,
        slide_index=slide_index,
        include_ast=include_ast,
        include_browser_screenshot=include_browser_screenshot,
        base_url=base_url,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
        render_mode=render_mode,
    )
    pptx_bytes = export_ir_to_pptx(compile_result["presentation"], output_path=output_path)
    return {
        "success": True,
        "presentation": compile_result["presentation"],
        "diagnostics": compile_result.get("diagnostics") or [],
        "ast": compile_result.get("ast"),
        "browser_screenshot_png_base64": compile_result.get("browser_screenshot_png_base64"),
        "pptx_bytes": pptx_bytes,
        "output_path": str(Path(output_path).resolve()) if output_path else None,
    }

html_to_pptx.__module__ = 'pptx_pipeline'
