# Origin: pptx2html/htmlir/compiler.py::_svg_stroke_width_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.svg._svg_attr_style_or_computed import _svg_attr_style_or_computed

def _svg_stroke_width_pt(
    path_node: dict[str, Any],
    svg_node: dict[str, Any],
    bounds: Bounds,
    view_box: tuple[float, float, float, float],
) -> float:
    raw = _svg_attr_style_or_computed(path_node, svg_node, "stroke-width", "strokeWidth")
    if raw is None:
        raw = _svg_attr_style_or_computed(svg_node, svg_node, "stroke-width", "strokeWidth")
    text = str(raw or "1").strip().lower()
    _, _, view_width, view_height = view_box
    unit_scale = ((bounds.width / max(view_width, 0.001)) + (bounds.height / max(view_height, 0.001))) / 2.0
    if re.fullmatch(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", text):
        return max(0.0, float(text) * unit_scale)
    return max(0.0, _css_px(text) * 0.75)

_svg_stroke_width_pt.__module__ = 'pptx2html.htmlir.compiler'
