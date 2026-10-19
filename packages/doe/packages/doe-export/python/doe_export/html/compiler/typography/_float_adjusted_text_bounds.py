# Origin: pptx2html/htmlir/compiler.py::_float_adjusted_text_bounds
from __future__ import annotations
from doe_export.html.compiler.document._HtmlFloatBox import _HtmlFloatBox
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_overlap_y import _bounds_overlap_y
from doe_export.html.compiler.geometry._bounds_right import _bounds_right
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant
from doe_export.html.compiler.typography._text_bounds_from_node import _text_bounds_from_node

def _float_adjusted_text_bounds(
    node: dict[str, Any],
    bounds: Bounds,
    active_float_boxes: list[_HtmlFloatBox],
    sx: float,
    sy: float,
) -> tuple[Bounds | None, float | None]:
    if not active_float_boxes:
        return None, None
    path = str(node.get("path") or "")
    candidate_boxes = [
        box
        for box in active_float_boxes
        if not (path and (path == box.path or _path_is_descendant(path, box.path)))
    ]
    if not candidate_boxes:
        return None, None
    text_bounds = _text_bounds_from_node(node, sx, sy)
    if text_bounds is None or text_bounds.width <= 0.25 or text_bounds.height <= 0.25:
        return None, None
    overlapping = [box for box in candidate_boxes if _bounds_overlap_y(text_bounds, box.bounds)]
    if not overlapping:
        return None, None
    right_limit = min(
        (box.bounds.left for box in overlapping if box.side == "right"),
        default=None,
    )
    for box in overlapping:
        if box.side == "left" and text_bounds.left + 0.5 < _bounds_right(box.bounds):
            return None, right_limit
        if box.side == "right" and _bounds_right(text_bounds) > box.bounds.left - 0.5:
            return None, right_limit
    return text_bounds, right_limit

_float_adjusted_text_bounds.__module__ = 'pptx2html.htmlir.compiler'
