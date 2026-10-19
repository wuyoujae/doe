# Origin: pptx2html/htmlir/compiler.py::_overflow_clip_bounds_for_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_nearly_equal import _bounds_nearly_equal
from doe_export.html.compiler.geometry._padding_box_bounds_from_node import _padding_box_bounds_from_node

def _overflow_clip_bounds_for_node(node: dict[str, Any], bounds: Bounds, sx: float, sy: float) -> list[tuple[str, Bounds]]:
    result = [("border-box", bounds)]
    padding_bounds = _padding_box_bounds_from_node(node, bounds, sx, sy)
    if padding_bounds is not None and not _bounds_nearly_equal(padding_bounds, bounds):
        result.append(("padding-box", padding_bounds))
    return result

_overflow_clip_bounds_for_node.__module__ = 'pptx2html.htmlir.compiler'
