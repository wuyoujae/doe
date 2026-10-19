# Origin: pptx2html/htmlir/compiler.py::_table_content_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.geometry._bounds_from_node import _bounds_from_node
from doe_export.html.compiler.geometry._union_bounds import _union_bounds

def _table_content_bounds(
    row_nodes: list[dict[str, Any]],
    sx: float,
    sy: float,
    canvas_size: tuple[float, float] = (SLIDE_WIDTH, SLIDE_HEIGHT),
) -> Bounds | None:
    return _union_bounds(
        [
            bounds
            for node in row_nodes
            if (bounds := _bounds_from_node(node, sx, sy, canvas_size)) is not None
        ]
    )

_table_content_bounds.__module__ = 'pptx2html.htmlir.compiler'
