# Origin: pptx2html/htmlir/compiler.py::_shape_geometry_for_node
from __future__ import annotations
from doe_export.html.compiler.geometry._HtmlClipMask import _HtmlClipMask
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import GeometryPath
from doe_export.html.compiler.geometry._custom_border_radius_paths_from_node import _custom_border_radius_paths_from_node
from doe_export.html.compiler.geometry._custom_clip_path_polygon_paths_from_node import _custom_clip_path_polygon_paths_from_node
from doe_export.html.compiler.geometry._geometry_from_node import _geometry_from_node

def _shape_geometry_for_node(
    node: dict[str, Any],
    bounds: Bounds,
    clip_mask: _HtmlClipMask | None,
) -> tuple[str, str, tuple[GeometryPath, ...]]:
    if clip_mask is not None:
        return clip_mask.geometry, clip_mask.geometry_source, clip_mask.geometry_paths
    clip_path_geometry = _custom_clip_path_polygon_paths_from_node(node, bounds)
    if clip_path_geometry:
        return "custom", "custom", tuple(clip_path_geometry)
    geometry_paths = _custom_border_radius_paths_from_node(node, bounds)
    if geometry_paths:
        return "custom", "custom", tuple(geometry_paths)
    return _geometry_from_node(node, bounds), "preset", tuple()

_shape_geometry_for_node.__module__ = 'pptx2html.htmlir.compiler'
