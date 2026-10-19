# Origin: pptx2html/htmlir/compiler.py::_svg_border_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Border
from doe_export.html.compiler.svg._svg_attr_style_or_computed import _svg_attr_style_or_computed
from doe_export.html.compiler.svg._svg_effective_opacity import _svg_effective_opacity
from doe_export.html.compiler.svg._svg_line_cap import _svg_line_cap
from doe_export.html.compiler.svg._svg_line_join import _svg_line_join
from doe_export.html.compiler.svg._svg_paint_color import _svg_paint_color
from doe_export.html.compiler.svg._svg_paint_opacity import _svg_paint_opacity
from doe_export.html.compiler.svg._svg_stroke_dash import _svg_stroke_dash
from doe_export.html.compiler.svg._svg_stroke_width_pt import _svg_stroke_width_pt

def _svg_border_from_node(
    path_node: dict[str, Any],
    svg_node: dict[str, Any],
    bounds: Bounds,
    view_box: tuple[float, float, float, float],
) -> Border | None:
    color = _svg_paint_color(path_node, svg_node, "stroke")
    if color is None:
        return None
    alpha = color[1] * _svg_paint_opacity(path_node, svg_node, "stroke") * _svg_effective_opacity(path_node, svg_node)
    if alpha <= 0.01:
        return None
    width = _svg_stroke_width_pt(path_node, svg_node, bounds, view_box)
    if width <= 0:
        return None
    cap = _svg_line_cap(_svg_attr_style_or_computed(path_node, svg_node, "stroke-linecap", "strokeLinecap"))
    join = _svg_line_join(_svg_attr_style_or_computed(path_node, svg_node, "stroke-linejoin", "strokeLinejoin"))
    return Border(
        width=round(max(0.25, width), 3),
        color=color[0],
        alpha=alpha if alpha < 0.999 else None,
        dash=_svg_stroke_dash(path_node, svg_node),
        cap=cap,
        join=join,
    )

_svg_border_from_node.__module__ = 'pptx2html.htmlir.compiler'
