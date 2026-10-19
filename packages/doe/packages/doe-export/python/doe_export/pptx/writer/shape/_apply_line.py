# Origin: pptx2html/server/pptx_writer.py::_apply_line
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Pt, RGBColor
from doe_export.pptx.writer.shape._apply_line_xml import _apply_line_xml
from doe_export.pptx.writer.xml._hex_color import _hex_color

def _apply_line(pptx_shape, border: dict[str, Any] | None) -> None:
    if not border or border.get("no_fill") or not border.get("width"):
        pptx_shape.line.fill.background()
        return
    color = _hex_color(border.get("color")) or RGBColor(0, 0, 0)
    pptx_shape.line.color.rgb = color
    pptx_shape.line.width = Pt(float(border.get("width") or 1))
    _apply_line_xml(pptx_shape, border)

_apply_line.__module__ = 'pptx2html.server.pptx_writer'
