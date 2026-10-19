# Origin: pptx2html/htmlir/compiler.py::_bounds_overlap_y
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_bottom import _bounds_bottom

def _bounds_overlap_y(a: Bounds, b: Bounds) -> bool:
    return a.top < _bounds_bottom(b) - 0.25 and _bounds_bottom(a) > b.top + 0.25

_bounds_overlap_y.__module__ = 'pptx2html.htmlir.compiler'
