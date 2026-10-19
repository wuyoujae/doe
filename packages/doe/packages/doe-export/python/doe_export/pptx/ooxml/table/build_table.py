# Origin: pptx2html/server/ooxml_pptx_writer.py::build_table
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.table.build_table_cell import build_table_cell
from doe_export.pptx.ooxml.xml.normalized_track_sizes import normalized_track_sizes
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.table.table_cell_text_container_metrics import table_cell_text_container_metrics

def build_table(
    ctx: SlideContext,
    table_ir: dict[str, Any],
    *,
    source_table: ET.Element | None = None,
    original_table: dict[str, Any] | None = None,
) -> ET.Element:
    tbl = ET.Element(qn(A, "tbl"))
    tbl_pr_attrs: dict[str, str] = {}
    for key, attr in (
        ("first_row", "firstRow"),
        ("first_col", "firstCol"),
        ("last_row", "lastRow"),
        ("last_col", "lastCol"),
        ("band_row", "bandRow"),
        ("band_col", "bandCol"),
    ):
        if table_ir.get(key) is not None:
            tbl_pr_attrs[attr] = bool_value(table_ir.get(key))
    tbl_pr = ET.SubElement(tbl, qn(A, "tblPr"), tbl_pr_attrs)
    if table_ir.get("style_id"):
        ET.SubElement(tbl_pr, qn(A, "tableStyleId")).text = str(table_ir.get("style_id"))

    rows = table_ir.get("rows") or []
    col_count = max(1, max((len(row) for row in rows), default=1))
    col_widths = normalized_track_sizes(table_ir.get("col_widths"), col_count, 100)
    grid = ET.SubElement(tbl, qn(A, "tblGrid"))
    for width in col_widths:
        ET.SubElement(grid, qn(A, "gridCol"), {"w": str(pt_to_emu(width))})

    row_heights = normalized_track_sizes(table_ir.get("row_heights"), max(1, len(rows)), 24)
    source_rows = source_table.findall(f"{{{A}}}tr") if source_table is not None else []
    original_rows = (original_table or {}).get("rows") or []
    for row_index, row in enumerate(rows or [[]]):
        tr = ET.SubElement(tbl, qn(A, "tr"), {"h": str(pt_to_emu(row_heights[row_index] if row_index < len(row_heights) else 24))})
        source_cells = (
            source_rows[row_index].findall(f"{{{A}}}tc")
            if row_index < len(source_rows)
            else []
        )
        original_row = original_rows[row_index] if row_index < len(original_rows) else []
        for col_index in range(col_count):
            cell = row[col_index] if col_index < len(row) else {}
            tr.append(
                build_table_cell(
                    ctx,
                    cell,
                    container_metrics=table_cell_text_container_metrics(
                        cell,
                        col_index=col_index,
                        row_index=row_index,
                        col_widths=col_widths,
                        row_heights=row_heights,
                    ),
                    source_cell=source_cells[col_index] if col_index < len(source_cells) else None,
                    original_cell=original_row[col_index] if col_index < len(original_row) else None,
                )
            )
    return tbl

build_table.__module__ = 'pptx2html.server.ooxml_pptx_writer'
