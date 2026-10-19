# Origin: pptx2html/htmlir/compiler.py::_union_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds

def _union_bounds(bounds_list: list[Bounds]) -> Bounds | None:
    bounds_list = [bounds for bounds in bounds_list if bounds.width > 0 and bounds.height > 0]
    if not bounds_list:
        return None
    left = min(bounds.left for bounds in bounds_list)
    top = min(bounds.top for bounds in bounds_list)
    right = max(bounds.left + bounds.width for bounds in bounds_list)
    bottom = max(bounds.top + bounds.height for bounds in bounds_list)
    return Bounds(round(left, 3), round(top, 3), round(max(0.0, right - left), 3), round(max(0.0, bottom - top), 3))

_union_bounds.__module__ = 'pptx2html.htmlir.compiler'
