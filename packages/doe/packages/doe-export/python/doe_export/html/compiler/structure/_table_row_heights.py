# Origin: pptx2html/htmlir/compiler.py::_table_row_heights
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.document._normalized_track_sizes import _normalized_track_sizes

def _table_row_heights(
    row_nodes: list[dict[str, Any]],
    table_bounds: Bounds,
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> list[float]:
    values: list[float | None] = []
    for row_node in row_nodes:
        bounds = _bounds_from_node(row_node, sx, sy, canvas_size)
        values.append(bounds.height if bounds and bounds.height > 0 else None)
    return _normalized_track_sizes(values, table_bounds.height)

_table_row_heights.__module__ = 'pptx2html.htmlir.compiler'
