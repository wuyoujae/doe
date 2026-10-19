# Origin: pptx2html/htmlir/compiler.py::_reconcile_shape_style
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.shared import Border, Bounds, CSS_PX_TO_PT, Fill, re
from doe_export.html.compiler.css._background_fills_from_node import _background_fills_from_node
from doe_export.html.compiler.typography._border_style_to_line import _border_style_to_line
from doe_export.html.compiler.css._box_shadow_from_node import _box_shadow_from_node
from doe_export.html.compiler.typography._canonical_inline_rotation import _canonical_inline_rotation
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.geometry._shape_geometry_for_node import _shape_geometry_for_node

def _reconcile_shape_style(
    shape: Shape,
    node: dict[str, Any],
    sx: float = 1.0,
    sy: float = 1.0,
) -> None:
    computed = _computed(node)
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    inline_style = str(attrs.get("style") or "")
    background_fills = _background_fills_from_node(node, shape.bounds)
    if background_fills:
        shape.fill = background_fills[-1]
    elif (
        re.search(
            r"(?:^|;)\s*background(?:-color|-image)?\s*:",
            inline_style,
            flags=re.IGNORECASE,
        )
        and str(computed.get("backgroundColor") or "").strip().lower()
        in {
            "transparent",
            "rgba(0, 0, 0, 0)",
        }
        and str(computed.get("backgroundImage") or "").strip().lower()
        in {"", "none"}
    ):
        shape.fill = Fill(type="none")
    opacity = _css_float(computed.get("opacity"), 1.0)
    opacity = max(0.0, min(1.0, opacity))
    if shape.image is not None:
        shape.image.alpha = opacity if opacity < 0.999 else None
    elif not background_fills and shape.fill is not None:
        if shape.fill.type == "picture" and shape.fill.image is not None:
            shape.fill.image.alpha = opacity if opacity < 0.999 else None
        else:
            shape.fill.alpha = opacity if opacity < 0.999 else None
    border_width_px = _css_px(computed.get("borderTopWidth"))
    border_color = _css_color(computed.get("borderTopColor"))
    border_style = str(computed.get("borderTopStyle") or "").strip().lower()
    if (
        border_width_px > 0
        and border_color
        and border_style not in {"none", "hidden"}
    ):
        dash, compound = _border_style_to_line(border_style)
        color, alpha = border_color
        shape.border = Border(
            color=color,
            alpha=alpha,
            width=border_width_px * CSS_PX_TO_PT,
            dash=dash,
            compound=compound,
            no_fill=False,
        )
    elif border_style in {"none", "hidden"} or border_width_px <= 0:
        shape.border = Border(no_fill=True)
    rotation = _canonical_inline_rotation(node)
    if rotation is not None:
        shape.rotation = rotation
    if re.search(
        r"(?:^|;)\s*border(?:-[a-z]+)?-radius\s*:",
        str(attrs.get("style") or ""),
        flags=re.IGNORECASE,
    ):
        geometry, geometry_source, geometry_paths = _shape_geometry_for_node(
            node,
            shape.bounds or Bounds(),
            None,
        )
        shape.geometry = geometry
        shape.geometry_source = geometry_source
        shape.geometry_paths = list(geometry_paths)
    shadow = _box_shadow_from_node(node, sx, sy)
    if shadow is not None:
        shape.shadow = shadow
    elif str(computed.get("boxShadow") or "").strip().lower() == "none":
        shape.shadow = None

_reconcile_shape_style.__module__ = 'pptx2html.htmlir.compiler'
