# Origin: pptx2html/htmlir/compiler.py::_rounded_overflow_clip_masks
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.geometry._HtmlClipMask import _HtmlClipMask
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.geometry._css_clips_overflow import _css_clips_overflow
from doe_export.html.compiler.geometry._overflow_clip_bounds_for_node import _overflow_clip_bounds_for_node
from doe_export.html.compiler.geometry._shape_geometry_for_node import _shape_geometry_for_node

def _rounded_overflow_clip_masks(
    nodes: list[dict[str, Any]],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> list[_HtmlClipMask]:
    masks: list[_HtmlClipMask] = []
    for node in nodes:
        if node.get("nodeType") != "element" or not node.get("visible"):
            continue
        path = str(node.get("path") or "")
        if not path or not _css_clips_overflow(_computed(node)):
            continue
        bounds = _bounds_from_node(node, sx, sy, canvas_size)
        if bounds is None or bounds.width < 0.25 or bounds.height < 0.25:
            continue
        for edge, clip_bounds in _overflow_clip_bounds_for_node(node, bounds, sx, sy):
            geometry, geometry_source, geometry_paths = _shape_geometry_for_node(node, clip_bounds, None)
            if geometry == "rect":
                continue
            masks.append(
                _HtmlClipMask(
                    path=path,
                    bounds=clip_bounds,
                    geometry=geometry,
                    geometry_source=geometry_source,
                    geometry_paths=tuple(geometry_paths),
                    edge=edge,
                )
            )
    return masks

_rounded_overflow_clip_masks.__module__ = 'pptx2html.htmlir.compiler'
