# Origin: pptx2html/server/ooxml_pptx_writer.py::shadow_direction_attr
from __future__ import annotations
from doe_export.pptx.ooxml.shared import math

def shadow_direction_attr(offset_x: float, offset_y: float) -> int:
    angle = math.degrees(math.atan2(offset_y, offset_x))
    if angle < 0:
        angle += 360.0
    return int(round(angle * 60000))

shadow_direction_attr.__module__ = 'pptx2html.server.ooxml_pptx_writer'
