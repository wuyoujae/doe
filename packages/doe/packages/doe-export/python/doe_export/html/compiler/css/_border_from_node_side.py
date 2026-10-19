# Origin: pptx2html/htmlir/compiler.py::_border_from_node_side
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Border
from doe_export.html.compiler.typography._border_style_to_line import _border_style_to_line
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._element_opacity import _element_opacity

def _border_from_node_side(node: dict[str, Any] | None, side: str, sx: float, sy: float) -> Border | None:
    if node is None:
        return None
    computed = _computed(node)
    side_key = side[:1].upper() + side[1:]
    style = str(computed.get(f"border{side_key}Style") or "none").strip().lower()
    if style in {"", "none", "hidden"}:
        return None
    width_px = _css_px(computed.get(f"border{side_key}Width"))
    if width_px <= 0:
        return None
    color = _css_color(computed.get(f"border{side_key}Color"))
    if color is None or color[1] <= 0.01:
        return None
    alpha = color[1] * _element_opacity(node)
    if alpha <= 0.01:
        return None
    dash, compound = _border_style_to_line(style)
    scale = sy if side in {"top", "bottom"} else sx
    return Border(
        width=round(max(0.25, width_px * scale), 3),
        color=color[0],
        alpha=alpha if alpha < 0.999 else None,
        dash=dash,
        compound=compound,
    )

_border_from_node_side.__module__ = 'pptx2html.htmlir.compiler'
