# Origin: pptx2html/htmlir/compiler.py::_border_inset_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.css._border_inset_pt import _border_inset_pt
from doe_export.html.compiler.document._computed import _computed

def _border_inset_bounds(node: dict[str, Any], bounds: Bounds, sx: float, sy: float) -> Bounds:
    computed = _computed(node)
    left = _border_inset_pt(computed, "left", sx)
    right = _border_inset_pt(computed, "right", sx)
    top = _border_inset_pt(computed, "top", sy)
    bottom = _border_inset_pt(computed, "bottom", sy)
    if max(left, right, top, bottom) <= 0:
        return bounds
    width = max(0.25, bounds.width - left - right)
    height = max(0.25, bounds.height - top - bottom)
    return Bounds(
        round(bounds.left + left, 3),
        round(bounds.top + top, 3),
        round(width, 3),
        round(height, 3),
    )

_border_inset_bounds.__module__ = 'pptx2html.htmlir.compiler'
