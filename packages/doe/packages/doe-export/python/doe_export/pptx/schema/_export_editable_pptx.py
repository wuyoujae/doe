# Origin: schema_v4_export.py::_export_editable_pptx
from __future__ import annotations
from .shared import Any, SCREENSHOT_HEIGHT_PX, SCREENSHOT_WIDTH_PX, SchemaV4ExportError, apply_schema_v4_native_components, embed_schema_v4_fonts, export_ir_to_pptx, parse_html_to_ir
from ._merge_presentations import _merge_presentations
from ._renderer_root import _renderer_root
from ._static_slide_html import _static_slide_html
from doe_export.pipeline.geometry._presentation_ir_in_export_coordinate_space import _presentation_ir_in_export_coordinate_space

def _export_editable_pptx(
    rendered_slides: list[dict[str, Any]],
    *,
    stylesheet: str,
    title: str,
    export_watermark: bool,
    embed_fonts: bool = True,
    viewport: tuple[int, int] = (SCREENSHOT_WIDTH_PX, SCREENSHOT_HEIGHT_PX),
) -> bytes:
    if not stylesheet.strip():
        raise SchemaV4ExportError("Schema v4 renderer returned no static stylesheet.")

    compiled: list[dict[str, Any]] = []
    for index, rendered_slide in enumerate(rendered_slides):
        root_html = rendered_slide.get("root_html")
        if not isinstance(root_html, str) or not root_html.strip():
            raise SchemaV4ExportError(f"Schema v4 slide {index + 1} has no static HTML.")
        html = _static_slide_html(stylesheet, root_html, viewport)
        result = parse_html_to_ir(
            html,
            slide_index=index,
            include_ast=False,
            include_browser_screenshot=False,
            base_url=None,
            root_selector=".schema-slide",
            viewport=viewport,
            timeout_ms=60_000,
            max_dom_nodes=20_000,
            render_mode="semantic",
        )
        compiled_presentation = result.get("presentation")
        if not isinstance(compiled_presentation, dict):
            raise SchemaV4ExportError(
                f"Schema v4 slide {index + 1} did not produce PresentationIR."
            )
        compiled.append(compiled_presentation)

    presentation = _merge_presentations(compiled, title=title)
    if viewport != (SCREENSHOT_WIDTH_PX, SCREENSHOT_HEIGHT_PX):
        presentation = _presentation_ir_in_export_coordinate_space(
            presentation,
            original_ir={"width": viewport[0] * 0.75, "height": viewport[1] * 0.75},
        )
    pptx_bytes = export_ir_to_pptx(
        presentation,
        export_watermark=bool(export_watermark),
        embed_fonts=embed_fonts,
    )
    native_components_by_slide = [
        item.get("native_components") if isinstance(item, dict) else []
        for item in rendered_slides
    ]
    pptx_bytes = apply_schema_v4_native_components(
        pptx_bytes,
        native_components_by_slide,
    )
    if not embed_fonts:
        return pptx_bytes
    return embed_schema_v4_fonts(
        pptx_bytes,
        presentation,
        native_components_by_slide,
        renderer_root=_renderer_root(),
    )

_export_editable_pptx.__module__ = 'schema_v4_export'
