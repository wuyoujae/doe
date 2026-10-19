# Origin: schema_v4_export.py::_export_visual_fidelity_pptx
from __future__ import annotations
from .shared import Any, Presentation, Pt, SLIDE_HEIGHT_PT, SLIDE_WIDTH_PT, apply_pptx_export_watermark, io
from ._decode_slide_screenshot import _decode_slide_screenshot

def _export_visual_fidelity_pptx(
    rendered_slides: list[dict[str, Any]],
    *,
    title: str,
    export_watermark: bool,
) -> bytes:
    presentation = Presentation()
    presentation.slide_width = Pt(SLIDE_WIDTH_PT)
    presentation.slide_height = Pt(SLIDE_HEIGHT_PT)
    presentation.core_properties.title = title
    blank_layout = presentation.slide_layouts[6]
    for index, rendered_slide in enumerate(rendered_slides):
        screenshot = _decode_slide_screenshot(
            rendered_slide.get("screenshot_png_base64"), index + 1
        )
        slide = presentation.slides.add_slide(blank_layout)
        slide.shapes.add_picture(
            io.BytesIO(screenshot),
            0,
            0,
            width=presentation.slide_width,
            height=presentation.slide_height,
        )
    output = io.BytesIO()
    presentation.save(output)
    payload = output.getvalue()
    return apply_pptx_export_watermark(payload) if export_watermark else payload

_export_visual_fidelity_pptx.__module__ = 'schema_v4_export'
