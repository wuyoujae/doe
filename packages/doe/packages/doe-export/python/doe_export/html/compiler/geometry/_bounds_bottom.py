# Origin: pptx2html/htmlir/compiler.py::_bounds_bottom
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds

def _bounds_bottom(bounds: Bounds) -> float:
    return bounds.top + bounds.height

_bounds_bottom.__module__ = 'pptx2html.htmlir.compiler'
