# Origin: pptx2html/htmlir/compiler.py::_text_visual_scale
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.geometry._visual_scale import _visual_scale

def _text_visual_scale(node: dict[str, Any], sx: float, sy: float) -> float:
    viewport_point_scale = (sx + sy) / 2.0
    return _visual_scale(node) * viewport_point_scale / CSS_PX_TO_PT

_text_visual_scale.__module__ = 'pptx2html.htmlir.compiler'
