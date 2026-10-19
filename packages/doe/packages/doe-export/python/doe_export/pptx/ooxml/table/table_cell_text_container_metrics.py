# Origin: pptx2html/server/ooxml_pptx_writer.py::table_cell_text_container_metrics
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.text._make_text_container_metrics import _make_text_container_metrics
from doe_export.pptx.ooxml.xml.safe_int import safe_int

def table_cell_text_container_metrics(
    cell: dict[str, Any],
    *,
    col_index: int,
    row_index: int,
    col_widths: list[float],
    row_heights: list[float],
) -> dict[str, Any] | None:
    colspan = max(1, safe_int(cell.get("colspan"), 1))
    rowspan = max(1, safe_int(cell.get("rowspan"), 1))
    width = sum(col_widths[col_index : min(len(col_widths), col_index + colspan)])
    height = sum(row_heights[row_index : min(len(row_heights), row_index + rowspan)])
    return _make_text_container_metrics(
        width,
        height,
        kind="table-cell",
        cell_margins=cell.get("margins"),
    )

table_cell_text_container_metrics.__module__ = 'pptx2html.server.ooxml_pptx_writer'
