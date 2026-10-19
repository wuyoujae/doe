# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._table_cell_height
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

@staticmethod
def _table_cell_height(shape: Shape, table, row: int, span: int) -> float:
    heights = table.row_heights or []
    selected = heights[row:row + span]
    if len(selected) == span and all(height is not None and height > 0 for height in selected):
        return float(sum(selected))
    total = shape.bounds.height if shape.bounds and shape.bounds.height > 0 else 100.0
    return total * span / max(1, len(table.rows))

_table_cell_height.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_table_cell_height.__func__.__qualname__ = 'HtmlRenderer._table_cell_height'
