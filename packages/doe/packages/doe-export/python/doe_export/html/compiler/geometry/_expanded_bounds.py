# Origin: pptx2html/htmlir/compiler.py::_expanded_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds, SLIDE_HEIGHT, SLIDE_WIDTH

def _expanded_bounds(
    bounds: Bounds,
    inset: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> Bounds | None:
    left = bounds.left - inset
    top = bounds.top - inset
    width = bounds.width + inset * 2.0
    height = bounds.height + inset * 2.0
    if width <= 0.25 or height <= 0.25:
        return None
    canvas_width, canvas_height = canvas_size
    if left > canvas_width or top > canvas_height or left + width < 0 or top + height < 0:
        return None
    left = max(-canvas_width, min(left, canvas_width))
    top = max(-canvas_height, min(top, canvas_height))
    width = max(0.25, min(width, canvas_width - left if left >= 0 else canvas_width))
    height = max(0.25, min(height, canvas_height - top if top >= 0 else canvas_height))
    return Bounds(round(left, 3), round(top, 3), round(width, 3), round(height, 3))

_expanded_bounds.__module__ = 'pptx2html.htmlir.compiler'
