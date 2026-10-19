# Origin: pptx2html/htmlir/compiler.py::_transform_adjusted_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, math
from doe_export.html.compiler.css._css_float import _css_float

def _transform_adjusted_bounds(node: dict[str, Any], bounds: Bounds, rotation: float, sx: float, sy: float) -> Bounds:
    layout = node.get("layout") if isinstance(node.get("layout"), dict) else {}
    width = _css_float(layout.get("offsetWidth"), 0.0) * sx
    height = _css_float(layout.get("offsetHeight"), 0.0) * sy
    if width <= 0.25 or height <= 0.25:
        return bounds
    center_x = bounds.left + bounds.width / 2.0
    center_y = bounds.top + bounds.height / 2.0
    left = center_x - width / 2.0
    top = center_y - height / 2.0
    if not all(math.isfinite(value) for value in (left, top, width, height, rotation)):
        return bounds
    return Bounds(round(left, 3), round(top, 3), round(width, 3), round(height, 3))

_transform_adjusted_bounds.__module__ = 'pptx2html.htmlir.compiler'
