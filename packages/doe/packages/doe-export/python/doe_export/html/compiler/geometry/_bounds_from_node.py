# Origin: pptx2html/htmlir/compiler.py::_bounds_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, SLIDE_HEIGHT, SLIDE_WIDTH, math

def _bounds_from_node(
    node: dict[str, Any],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> Bounds | None:
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    try:
        left = float(rect.get("left")) * sx
        top = float(rect.get("top")) * sy
        width = float(rect.get("width")) * sx
        height = float(rect.get("height")) * sy
    except (TypeError, ValueError):
        return None
    if not all(math.isfinite(value) for value in (left, top, width, height)):
        return None
    canvas_width, canvas_height = canvas_size
    if left > canvas_width or top > canvas_height or left + width < 0 or top + height < 0:
        return None
    left = max(-canvas_width, min(left, canvas_width))
    top = max(-canvas_height, min(top, canvas_height))
    width = max(0.0, min(width, canvas_width - left if left >= 0 else canvas_width))
    height = max(0.0, min(height, canvas_height - top if top >= 0 else canvas_height))
    return Bounds(round(left, 3), round(top, 3), round(width, 3), round(height, 3))

_bounds_from_node.__module__ = 'pptx2html.htmlir.compiler'
