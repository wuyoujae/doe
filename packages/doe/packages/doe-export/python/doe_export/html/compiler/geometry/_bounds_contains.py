# Origin: pptx2html/htmlir/compiler.py::_bounds_contains
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_bottom import _bounds_bottom
from doe_export.html.compiler.geometry._bounds_right import _bounds_right

def _bounds_contains(outer: Bounds, inner: Bounds, tolerance: float = 1.0) -> bool:
    return (
        outer.left <= inner.left + tolerance
        and outer.top <= inner.top + tolerance
        and _bounds_right(outer) >= _bounds_right(inner) - tolerance
        and _bounds_bottom(outer) >= _bounds_bottom(inner) - tolerance
    )

_bounds_contains.__module__ = 'pptx2html.htmlir.compiler'
