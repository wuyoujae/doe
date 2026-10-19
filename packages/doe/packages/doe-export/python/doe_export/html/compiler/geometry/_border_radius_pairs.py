# Origin: pptx2html/htmlir/compiler.py::_border_radius_pairs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.geometry._css_axis_scale_from_layout import _css_axis_scale_from_layout
from doe_export.html.compiler.geometry._radius_pair import _radius_pair

def _border_radius_pairs(node: dict[str, Any], bounds: Bounds) -> list[tuple[float, float]]:
    computed = _computed(node)
    shorthand = computed.get("borderRadius")
    scale_x = _css_axis_scale_from_layout(node, bounds, axis="x")
    scale_y = _css_axis_scale_from_layout(node, bounds, axis="y")
    keys = (
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomRightRadius",
        "borderBottomLeftRadius",
    )
    return [_radius_pair(computed.get(key) or shorthand, bounds, scale_x, scale_y) for key in keys]

_border_radius_pairs.__module__ = 'pptx2html.htmlir.compiler'
