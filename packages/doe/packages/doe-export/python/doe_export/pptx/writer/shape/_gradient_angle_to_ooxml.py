# Origin: pptx2html/server/pptx_writer.py::_gradient_angle_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _gradient_angle_to_ooxml(value: Any) -> int:
    try:
        angle = float(value or 0)
    except (TypeError, ValueError):
        angle = 0.0
    return int(round((angle % 360.0) * 60000))

_gradient_angle_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
