# Origin: pptx2html/htmlir/compiler.py::_custom_border_radius_paths_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import GeometryPath
from doe_export.html.compiler.geometry._has_percent_ellipse_radius import _has_percent_ellipse_radius
from doe_export.html.compiler.geometry._normalized_border_radius_pairs import _normalized_border_radius_pairs
from doe_export.html.compiler.svg._rounded_rect_svg_path import _rounded_rect_svg_path

def _custom_border_radius_paths_from_node(node: dict[str, Any], bounds: Bounds) -> list[GeometryPath]:
    radii = _normalized_border_radius_pairs(node, bounds)
    if not any(horizontal > 0.01 or vertical > 0.01 for horizontal, vertical in radii):
        return []
    if _has_percent_ellipse_radius(node) and all(
        horizontal >= bounds.width * 0.49 and vertical >= bounds.height * 0.49 for horizontal, vertical in radii
    ):
        return []
    # Office's preset roundRect radius does not preserve a CSS pixel radius.
    d = _rounded_rect_svg_path(radii, bounds)
    return [GeometryPath(d=d, fill="norm", stroke=True)] if d else []

_custom_border_radius_paths_from_node.__module__ = 'pptx2html.htmlir.compiler'
