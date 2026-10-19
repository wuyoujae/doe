# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._table_cell_width
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

@staticmethod
def _table_cell_width(shape: Shape, table, column: int, span: int, column_count: int) -> float:
    widths = table.col_widths or []
    selected = widths[column:column + span]
    if len(selected) == span and all(width is not None and width > 0 for width in selected):
        return float(sum(selected))
    total = shape.bounds.width if shape.bounds and shape.bounds.width > 0 else 100.0
    return total * span / max(1, column_count)

_table_cell_width.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_table_cell_width.__func__.__qualname__ = 'HtmlRenderer._table_cell_width'
