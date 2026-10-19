# Origin: pptx2html/htmlir/compiler.py::_padding_box_bounds_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._css_axis_scale_from_layout import _css_axis_scale_from_layout
from doe_export.html.compiler.css._css_float import _css_float

def _padding_box_bounds_from_node(node: dict[str, Any], bounds: Bounds, sx: float, sy: float) -> Bounds | None:
    layout = node.get("layout") if isinstance(node.get("layout"), dict) else {}
    box_model = layout.get("boxModel") if isinstance(layout.get("boxModel"), dict) else {}
    if not box_model:
        return None
    scale_x = _css_axis_scale_from_layout(node, bounds, axis="x")
    scale_y = _css_axis_scale_from_layout(node, bounds, axis="y")
    border_left = max(0.0, _css_float(box_model.get("borderLeft"), 0.0) * scale_x)
    border_right = max(0.0, _css_float(box_model.get("borderRight"), 0.0) * scale_x)
    border_top = max(0.0, _css_float(box_model.get("borderTop"), 0.0) * scale_y)
    border_bottom = max(0.0, _css_float(box_model.get("borderBottom"), 0.0) * scale_y)
    if max(border_left, border_right, border_top, border_bottom) <= 0.01:
        return None
    width = max(0.0, bounds.width - border_left - border_right)
    height = max(0.0, bounds.height - border_top - border_bottom)
    if width < 0.25 or height < 0.25:
        return None
    return Bounds(
        round(bounds.left + border_left, 3),
        round(bounds.top + border_top, 3),
        round(width, 3),
        round(height, 3),
    )

_padding_box_bounds_from_node.__module__ = 'pptx2html.htmlir.compiler'
