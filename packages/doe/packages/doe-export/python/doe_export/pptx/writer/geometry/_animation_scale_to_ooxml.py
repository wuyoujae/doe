# Origin: pptx2html/server/pptx_writer.py::_animation_scale_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._safe_float import _safe_float

def _animation_scale_to_ooxml(value: Any) -> str:
    return str(max(0, int(round(_safe_float(value, 1.0) * 100000))))

_animation_scale_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
