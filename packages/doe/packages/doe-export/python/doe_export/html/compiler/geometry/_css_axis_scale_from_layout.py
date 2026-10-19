# Origin: pptx2html/htmlir/compiler.py::_css_axis_scale_from_layout
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.geometry._visual_scale import _visual_scale

def _css_axis_scale_from_layout(node: dict[str, Any], bounds: Bounds, *, axis: str) -> float:
    layout = node.get("layout") if isinstance(node.get("layout"), dict) else {}
    if axis == "x":
        layout_value = _css_float(layout.get("offsetWidth"), 0.0)
        bound_value = bounds.width
    else:
        layout_value = _css_float(layout.get("offsetHeight"), 0.0)
        bound_value = bounds.height
    if layout_value > 0 and bound_value > 0:
        scale = bound_value / layout_value
        if 0.01 <= scale <= 100:
            return scale
    return _visual_scale(node)

_css_axis_scale_from_layout.__module__ = 'pptx2html.htmlir.compiler'
