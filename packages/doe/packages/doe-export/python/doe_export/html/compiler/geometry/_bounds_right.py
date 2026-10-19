# Origin: pptx2html/htmlir/compiler.py::_bounds_right
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds

def _bounds_right(bounds: Bounds) -> float:
    return bounds.left + bounds.width

_bounds_right.__module__ = 'pptx2html.htmlir.compiler'
