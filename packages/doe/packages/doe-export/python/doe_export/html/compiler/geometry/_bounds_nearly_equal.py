# Origin: pptx2html/htmlir/compiler.py::_bounds_nearly_equal
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds

def _bounds_nearly_equal(a: Bounds, b: Bounds, tolerance: float = 1.0) -> bool:
    return (
        abs(a.left - b.left) <= tolerance
        and abs(a.top - b.top) <= tolerance
        and abs(a.width - b.width) <= tolerance
        and abs(a.height - b.height) <= tolerance
    )

_bounds_nearly_equal.__module__ = 'pptx2html.htmlir.compiler'
