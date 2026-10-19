# Origin: pptx2html/htmlir/compiler.py::_border_side_specs
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._border_style_to_line import _border_style_to_line
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._element_opacity import _element_opacity

def _border_side_specs(node: dict[str, Any], sx: float, sy: float) -> list[dict[str, Any]]:
    computed = _computed(node)
    opacity = _element_opacity(node)
    sides = [
        ("top", "borderTopWidth", "borderTopColor", "borderTopStyle"),
        ("right", "borderRightWidth", "borderRightColor", "borderRightStyle"),
        ("bottom", "borderBottomWidth", "borderBottomColor", "borderBottomStyle"),
        ("left", "borderLeftWidth", "borderLeftColor", "borderLeftStyle"),
    ]
    specs: list[dict[str, Any]] = []
    for side, width_key, color_key, style_key in sides:
        style = str(computed.get(style_key) or "solid").strip().lower()
        if style in {"none", "hidden"}:
            continue
        width_px = _css_px(computed.get(width_key))
        if width_px <= 0:
            continue
        color = _css_color(computed.get(color_key))
        if color is None or color[1] <= 0.01:
            continue
        alpha = color[1] * opacity
        if alpha <= 0.01:
            continue
        dash, compound = _border_style_to_line(style)
        specs.append(
            {
                "side": side,
                "width_px": width_px,
                "strip_width_pt": max(0.5, width_px * (sy if side in {"top", "bottom"} else sx)),
                "outline_width_pt": max(0.5, width_px * ((sx + sy) / 2.0)),
                "color": color[0],
                "alpha": alpha,
                "dash": dash,
                "compound": compound,
            }
        )
    return specs

_border_side_specs.__module__ = 'pptx2html.htmlir.compiler'
