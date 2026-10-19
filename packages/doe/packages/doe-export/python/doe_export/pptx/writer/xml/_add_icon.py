# Origin: pptx2html/server/pptx_writer.py::_add_icon
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import MSO_CONNECTOR
from doe_export.pptx.writer.shape._apply_line import _apply_line

def _add_icon(slide, shape: dict[str, Any], left, top, width, height):
    # First-pass geometry icon export: a check-mark polyline matching the
    # editor's current icon factory.
    x1 = left + width * 0.12
    y1 = top + height * 0.53
    x2 = left + width * 0.39
    y2 = top + height * 0.78
    x3 = left + width * 0.88
    y3 = top + height * 0.22
    line1 = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    line2 = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x2, y2, x3, y3)
    for line in (line1, line2):
        _apply_line(line, shape.get("border") or {"width": 6, "color": "176D88", "cap": "rnd"})
    return line1

_add_icon.__module__ = 'pptx2html.server.pptx_writer'
