# Origin: pptx2html/server/pptx_writer.py::_add_table
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Pt
from doe_export.pptx.writer.table._apply_cell_fill import _apply_cell_fill
from doe_export.pptx.writer.table._apply_table_cell_properties import _apply_table_cell_properties
from doe_export.pptx.writer.text._apply_text_frame import _apply_text_frame
from doe_export.pptx.writer.table._clear_table_defaults import _clear_table_defaults
from doe_export.pptx.writer.text._plain_text_frame import _plain_text_frame
from doe_export.pptx.writer.xml._safe_int import _safe_int
from doe_export.pptx.writer.text._text_container_metrics import _text_container_metrics

def _add_table(slide, shape: dict[str, Any], left, top, width, height):
    table_ir = shape.get("table") or {}
    rows = table_ir.get("rows") or []
    row_count = max(1, len(rows))
    col_count = max(1, max((len(row) for row in rows), default=1))
    table_shape = slide.shapes.add_table(row_count, col_count, left, top, width, height)
    _clear_table_defaults(table_shape)
    table = table_shape.table

    for col_index, col_width in enumerate(table_ir.get("col_widths") or []):
        if col_index < len(table.columns):
            table.columns[col_index].width = Pt(float(col_width or 1))
    for row_index, row_height in enumerate(table_ir.get("row_heights") or []):
        if row_index < len(table.rows):
            table.rows[row_index].height = Pt(float(row_height or 1))

    for row_index in range(row_count):
        row = rows[row_index] if row_index < len(rows) else []
        for col_index in range(col_count):
            cell_ir = row[col_index] if col_index < len(row) else {}
            if cell_ir.get("h_merge") or cell_ir.get("v_merge"):
                continue
            colspan = max(1, _safe_int(cell_ir.get("colspan"), 1))
            rowspan = max(1, _safe_int(cell_ir.get("rowspan"), 1))
            if colspan <= 1 and rowspan <= 1:
                continue
            end_row = min(row_count - 1, row_index + rowspan - 1)
            end_col = min(col_count - 1, col_index + colspan - 1)
            if end_row > row_index or end_col > col_index:
                table.cell(row_index, col_index).merge(table.cell(end_row, end_col))

    for row_index in range(row_count):
        row = rows[row_index] if row_index < len(rows) else []
        for col_index in range(col_count):
            cell_ir = row[col_index] if col_index < len(row) else {}
            if cell_ir.get("h_merge") or cell_ir.get("v_merge"):
                continue
            cell = table.cell(row_index, col_index)
            _apply_table_cell_properties(cell, cell_ir)
            _apply_cell_fill(cell, cell_ir.get("fill"), slide)
            text_frame = cell_ir.get("text_frame") or _plain_text_frame(cell_ir.get("text") or "")
            colspan = max(1, _safe_int(cell_ir.get("colspan"), 1))
            rowspan = max(1, _safe_int(cell_ir.get("rowspan"), 1))
            cell_width = sum(
                table.columns[index].width.pt
                for index in range(col_index, min(col_count, col_index + colspan))
            )
            cell_height = sum(
                table.rows[index].height.pt
                for index in range(row_index, min(row_count, row_index + rowspan))
            )
            _apply_text_frame(
                cell.text_frame,
                text_frame,
                container_metrics=_text_container_metrics(
                    cell_width,
                    cell_height,
                    kind="table-cell",
                    cell_margins=cell_ir.get("margins"),
                ),
            )
    return table_shape

_add_table.__module__ = 'pptx2html.server.pptx_writer'
