# Origin: pptx2html/htmlir/compiler.py::_geometry_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._border_radius_pairs import _border_radius_pairs
from doe_export.html.compiler.geometry._has_percent_ellipse_radius import _has_percent_ellipse_radius

def _geometry_from_node(node: dict[str, Any], bounds: Bounds) -> str:
    radii = _border_radius_pairs(node, bounds)
    if not any(horizontal > 0.01 or vertical > 0.01 for horizontal, vertical in radii):
        return "rect"
    if _has_percent_ellipse_radius(node) and all(
        horizontal >= bounds.width * 0.49 and vertical >= bounds.height * 0.49 for horizontal, vertical in radii
    ):
        return "ellipse"
    return "roundRect"

_geometry_from_node.__module__ = 'pptx2html.htmlir.compiler'
