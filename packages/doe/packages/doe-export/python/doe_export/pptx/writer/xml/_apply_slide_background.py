# Origin: pptx2html/server/pptx_writer.py::_apply_slide_background
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._apply_picture_slide_background import _apply_picture_slide_background
from doe_export.pptx.writer.xml._hex_color import _hex_color

def _apply_slide_background(slide, slide_ir: dict[str, Any]) -> None:
    fill = ((slide_ir.get("background") or {}).get("fill") or {})
    if fill.get("type") == "picture" and _apply_picture_slide_background(slide, fill):
        return
    color = _hex_color(fill.get("color"))
    if fill.get("type") == "solid" and color:
        background = slide.background
        background.fill.solid()
        background.fill.fore_color.rgb = color

_apply_slide_background.__module__ = 'pptx2html.server.pptx_writer'
