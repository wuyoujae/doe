# Origin: pptx2html/htmlir/compiler.py::_text_shape_bounds_from_node
from __future__ import annotations
from doe_export.html.compiler.document._HtmlFloatBox import _HtmlFloatBox
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, HTML_TEXT_WIDTH_SAFETY, SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.geometry._border_inset_bounds import _border_inset_bounds
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.typography._float_adjusted_text_bounds import _float_adjusted_text_bounds
from doe_export.html.compiler.document._layout_item_right_limit import _layout_item_right_limit
from doe_export.html.compiler.typography._text_align import _text_align
from doe_export.html.compiler.typography._text_visual_scale import _text_visual_scale

def _text_shape_bounds_from_node(
    node: dict[str, Any],
    bounds: Bounds,
    nodes_by_path: dict[str, dict[str, Any]],
    active_float_boxes: list[_HtmlFloatBox],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> Bounds:
    anonymous = node.get("anonymousTextRect")
    if isinstance(anonymous, dict) and anonymous.get("width", 0) > 0:
        # Anonymous flex/grid text items start after their sibling swatch/icon.
        line_height = _css_px(_computed(node).get("lineHeight")) * _text_visual_scale(node, sx, sy)
        height = max(line_height, float(anonymous["height"]))
        top = anonymous["top"] + (anonymous["height"] - height) / 2
        return Bounds(anonymous["left"] * sx, top * sy, anonymous["width"] * sx, height * sy)
    bounds = _border_inset_bounds(node, bounds, sx, sy)
    float_bounds, right_limit = _float_adjusted_text_bounds(node, bounds, active_float_boxes, sx, sy)
    if float_bounds is not None:
        bounds = float_bounds
    # Widening an aligned box moves its visual anchor (for example list numbers).
    if _text_align(_computed(node)) in {"ctr", "r", "just"}:
        return bounds
    layout_right_limit = _layout_item_right_limit(node, nodes_by_path, sx, sy, canvas_size)
    extra = bounds.width * (HTML_TEXT_WIDTH_SAFETY - 1.0)
    if extra <= 0:
        return bounds
    canvas_width = canvas_size[0]
    max_right = min(canvas_width, right_limit) if right_limit is not None else canvas_width
    if layout_right_limit is not None:
        max_right = min(max_right, layout_right_limit)
    max_width = max(0.25, max_right - bounds.left)
    return Bounds(
        bounds.left,
        bounds.top,
        round(min(max_width, bounds.width + extra), 3),
        bounds.height,
    )

_text_shape_bounds_from_node.__module__ = 'pptx2html.htmlir.compiler'
