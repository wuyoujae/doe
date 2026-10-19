# Origin: pptx2html/server/pptx_writer.py::_shadow_direction_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import math

def _shadow_direction_to_ooxml(offset_x: float, offset_y: float) -> int:
    angle = math.degrees(math.atan2(offset_y, offset_x))
    if angle < 0:
        angle += 360.0
    return int(round(angle * 60000))

_shadow_direction_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
