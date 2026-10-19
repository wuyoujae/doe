# Origin: pptx2html/htmlir/compiler.py::_outline_shape_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Border, Fill, SLIDE_HEIGHT, SLIDE_WIDTH, Shape
from doe_export.html.compiler.typography._border_style_to_line import _border_style_to_line
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.geometry._expanded_bounds import _expanded_bounds
from doe_export.html.compiler.structure._shape_name import _shape_name

def _outline_shape_from_node(
    node: dict[str, Any],
    bounds: Bounds,
    geometry: str,
    shape_id: int,
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> Shape | None:
    computed = _computed(node)
    style = str(computed.get("outlineStyle") or "").strip().lower()
    if not style or style in {"none", "hidden"}:
        return None
    width_px = _css_px(computed.get("outlineWidth"))
    if width_px <= 0:
        return None
    color = _css_color(computed.get("outlineColor"))
    if color is None:
        color = _css_color(computed.get("color"))
    if color is None or color[1] <= 0.01:
        return None

    alpha = color[1] * _element_opacity(node)
    if alpha <= 0.01:
        return None

    scale = (sx + sy) / 2.0
    width_pt = max(0.5, width_px * scale)
    offset_pt = _css_px(computed.get("outlineOffset")) * scale
    path_inset = offset_pt + width_pt / 2.0
    outline_bounds = _expanded_bounds(bounds, path_inset, canvas_size)
    if outline_bounds is None:
        return None
    dash, compound = _border_style_to_line(style)
    diagnostics = ["htmlir:outline"]
    if abs(offset_pt) > 0.001:
        diagnostics.append("htmlir:outline-offset")
    if style == "auto":
        diagnostics.append("htmlir:outline-auto-as-solid")
    return Shape(
        type="auto_shape",
        name=_shape_name(node, "outline"),
        shape_id=shape_id,
        bounds=outline_bounds,
        geometry=geometry,
        geometry_source="preset",
        fill=Fill(type="none"),
        border=Border(
            width=round(width_pt, 3),
            color=color[0],
            alpha=alpha if alpha < 0.999 else None,
            dash=dash,
            compound=compound,
        ),
        diagnostics=diagnostics,
    )

_outline_shape_from_node.__module__ = 'pptx2html.htmlir.compiler'
