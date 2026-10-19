# Origin: pptx2html/server/pptx_writer.py::_motion_path_from_step
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._format_motion_value import _format_motion_value
from doe_export.pptx.writer.xml._safe_float import _safe_float

def _motion_path_from_step(step: dict[str, Any]) -> str:
    dx = _safe_float(step.get("motion_dx"), 0.0)
    dy = _safe_float(step.get("motion_dy"), 0.0)
    return f"M 0 0 L {_format_motion_value(dx)} {_format_motion_value(dy)}"

_motion_path_from_step.__module__ = 'pptx2html.server.pptx_writer'
