# Origin: pptx2html/server/pptx_writer.py::_add_connector
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import MSO_CONNECTOR, Pt
from doe_export.pptx.writer.shape._apply_line import _apply_line
from doe_export.pptx.writer.shape._apply_shadow import _apply_shadow

def _add_connector(slide, shape: dict[str, Any], left: float, top: float, width: float, height: float):
    x1 = Pt(left)
    y1 = Pt(top)
    x2 = Pt(left + width)
    y2 = Pt(top + height)
    connector = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    if shape.get("rotation"):
        connector.rotation = float(shape.get("rotation") or 0)
    _apply_line(connector, shape.get("border"))
    _apply_shadow(connector, shape.get("shadow"))
    return connector

_add_connector.__module__ = 'pptx2html.server.pptx_writer'
