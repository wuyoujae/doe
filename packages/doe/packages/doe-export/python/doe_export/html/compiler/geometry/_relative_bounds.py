# Origin: pptx2html/htmlir/compiler.py::_relative_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds

def _relative_bounds(bounds: Bounds, origin: Bounds) -> Bounds:
    return Bounds(
        round(bounds.left - origin.left, 3),
        round(bounds.top - origin.top, 3),
        bounds.width,
        bounds.height,
    )

_relative_bounds.__module__ = 'pptx2html.htmlir.compiler'
