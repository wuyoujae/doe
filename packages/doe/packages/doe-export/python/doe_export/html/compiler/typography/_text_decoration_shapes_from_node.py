# Origin: pptx2html/htmlir/compiler.py::_text_decoration_shapes_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._decoration_line_offsets import _decoration_line_offsets
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.typography._text_bounds_from_node import _text_bounds_from_node
from doe_export.html.compiler.typography._text_decoration_color import _text_decoration_color
from doe_export.html.compiler.typography._text_decoration_line_shape import _text_decoration_line_shape
from doe_export.html.compiler.typography._text_decoration_lines import _text_decoration_lines
from doe_export.html.compiler.typography._text_decoration_style import _text_decoration_style
from doe_export.html.compiler.typography._text_decoration_thickness_pt import _text_decoration_thickness_pt
from doe_export.html.compiler.typography._text_visual_scale import _text_visual_scale
from doe_export.html.compiler.typography._uses_text_decoration_overlay import _uses_text_decoration_overlay

def _text_decoration_shapes_from_node(
    node: dict[str, Any],
    bounds: Bounds,
    start_id: int,
    sx: float,
    sy: float,
) -> list[Shape]:
    computed = _computed(node)
    lines = _text_decoration_lines(computed)
    if not lines:
        return []
    font_size_px = _css_px(computed.get("fontSize")) or 16.0
    font_size_pt = max(1.0, font_size_px * _text_visual_scale(node, sx, sy) * CSS_PX_TO_PT)
    width_pt = _text_decoration_thickness_pt(computed, font_size_pt) or max(0.5, font_size_pt / 16.0)
    text_bounds = _text_bounds_from_node(node, sx, sy) or bounds
    if text_bounds.width <= 0.25:
        return []
    color, alpha = _text_decoration_color(computed, _element_opacity(node))
    style = _text_decoration_style(computed.get("textDecorationStyle"))
    result: list[Shape] = []
    next_id = start_id

    def append_line(kind: str, y: float) -> None:
        nonlocal next_id
        for line_y in _decoration_line_offsets(y, width_pt, style):
            result.append(
                _text_decoration_line_shape(
                    node=node,
                    kind=kind,
                    shape_id=next_id,
                    bounds=text_bounds,
                    y=round(line_y, 3),
                    width_pt=width_pt,
                    color=color,
                    alpha=alpha,
                    style=style,
                )
            )
            next_id += 1

    if "overline" in lines:
        append_line("overline", text_bounds.top + width_pt / 2.0)
    if "underline" in lines and _uses_text_decoration_overlay(node):
        underline_y = text_bounds.top + text_bounds.height - max(width_pt / 2.0, font_size_pt * 0.08)
        append_line("underline", underline_y)
    if "line-through" in lines and _uses_text_decoration_overlay(node):
        append_line("line-through", text_bounds.top + text_bounds.height * 0.54)
    return result

_text_decoration_shapes_from_node.__module__ = 'pptx2html.htmlir.compiler'
