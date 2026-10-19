# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_table
from __future__ import annotations
from doe_export.ir.importer.shared import GraphicFrame, NAMESPACE, TableCell, TableInfo, copy, emu_to_pt, parse_bool

def _build_table(self, shape: GraphicFrame) -> TableInfo:
    graphic = shape._element.find(f"{{{NAMESPACE.DML_MAIN}}}graphic")
    if graphic is None:
        return TableInfo()
    data = graphic.find(f"{{{NAMESPACE.DML_MAIN}}}graphicData")
    if data is None:
        return TableInfo()
    tbl = data.find(f"{{{NAMESPACE.DML_MAIN}}}tbl")
    if tbl is None:
        return TableInfo()

    tbl_pr = tbl.find(f"{{{NAMESPACE.DML_MAIN}}}tblPr")
    style_elem = tbl_pr.find(f"{{{NAMESPACE.DML_MAIN}}}tableStyleId") if tbl_pr is not None else None
    style_id = style_elem.text if style_elem is not None and style_elem.text else None
    rows: list[list[TableCell]] = []
    tbl_grid = tbl.find(f"{{{NAMESPACE.DML_MAIN}}}tblGrid")
    grid_cols = (
        tbl_grid.findall(f"{{{NAMESPACE.DML_MAIN}}}gridCol")
        if tbl_grid is not None
        else []
    )
    col_widths = [emu_to_pt(col.get("w")) or 0.0 for col in grid_cols]
    num_cols = len(grid_cols)
    row_heights: list[float] = []

    for tr in tbl.findall(f"{{{NAMESPACE.DML_MAIN}}}tr"):
        row_heights.append(emu_to_pt(tr.get("h")) or 0.0)
        row_cells: list[TableCell] = []
        consumed_cols = 0
        for tc in tr.findall(f"{{{NAMESPACE.DML_MAIN}}}tc"):
            if parse_bool(tc.get("hMerge")) or parse_bool(tc.get("vMerge")):
                consumed_cols += 1
                continue

            tx_body = tc.find(f"{{{NAMESPACE.DML_MAIN}}}txBody")
            text = ""
            text_frame = None
            table_font_props = self._table_cell_text_style_props(
                style_id,
                tbl_pr,
                row_index=len(rows),
                col_index=consumed_cols,
                row_count=len(tbl.findall(f"{{{NAMESPACE.DML_MAIN}}}tr")),
                col_count=num_cols,
            )
            if tx_body is not None:
                texts = [
                    t.text
                    for t in tx_body.findall(f".//{{{NAMESPACE.DML_MAIN}}}t")
                    if t.text
                ]
                text = "".join(texts)
                text_frame = self._build_text_frame_from_element(
                    shape,
                    tx_body,
                    table_font_props=table_font_props,
                )
            colspan = self._positive_int(tc.get("gridSpan"))
            rowspan = self._positive_int(tc.get("rowSpan"))
            tc_pr = tc.find(f"{{{NAMESPACE.DML_MAIN}}}tcPr")
            table_visual = self._table_cell_visual_style(
                style_id,
                tbl_pr,
                row_index=len(rows),
                col_index=consumed_cols,
                row_count=len(tbl.findall(f"{{{NAMESPACE.DML_MAIN}}}tr")),
                col_count=num_cols,
            )
            fill = self._parse_fill(tc_pr, shape) if tc_pr is not None else None
            if fill is None:
                fill = copy.deepcopy(table_visual.get("fill"))
            margins = self._table_cell_margins(tc_pr)
            borders = {
                side: copy.deepcopy(border)
                for side, border in table_visual.get("borders", {}).items()
            }
            for side, border in self._table_cell_borders(tc_pr).items():
                if border is not None:
                    borders[side] = border
            row_cells.append(
                TableCell(
                    text=text,
                    colspan=colspan,
                    rowspan=rowspan,
                    text_frame=text_frame,
                    fill=fill,
                    margins=margins,
                    vertical_align=tc_pr.get("anchor") if tc_pr is not None else None,
                    border_left=borders.get("left"),
                    border_right=borders.get("right"),
                    border_top=borders.get("top"),
                    border_bottom=borders.get("bottom"),
                )
            )
            consumed_cols += colspan

        # Pad short rows
        while consumed_cols < num_cols:
            row_cells.append(TableCell())
            consumed_cols += 1
        rows.append(row_cells)

    return TableInfo(
        rows=rows,
        col_widths=col_widths,
        row_heights=row_heights,
        style_id=style_id,
        first_row=parse_bool(tbl_pr.get("firstRow")) if tbl_pr is not None else None,
        first_col=parse_bool(tbl_pr.get("firstCol")) if tbl_pr is not None else None,
        last_row=parse_bool(tbl_pr.get("lastRow")) if tbl_pr is not None else None,
        last_col=parse_bool(tbl_pr.get("lastCol")) if tbl_pr is not None else None,
        band_row=parse_bool(tbl_pr.get("bandRow")) if tbl_pr is not None else None,
        band_col=parse_bool(tbl_pr.get("bandCol")) if tbl_pr is not None else None,
    )

_build_table.__module__ = 'pptx2html.ir.builder'
_build_table.__qualname__ = 'PresentationBuilder._build_table'
