# Origin: pptx2html/ir/builder.py::PresentationBuilder._table_cell_visual_style
from __future__ import annotations
from doe_export.ir.importer.shared import Border, ET, NAMESPACE, Optional, parse_bool

def _table_cell_visual_style(
    self,
    style_id: Optional[str],
    tbl_pr: Optional[ET.Element],
    row_index: int,
    col_index: int,
    row_count: int,
    col_count: int,
) -> dict:
    if not style_id:
        return {}
    styles = self._table_cell_style_elements.get(style_id)
    if not styles:
        return {}

    result: dict = {"borders": {}}

    def section_visual(section_name: str, *, whole_table: bool = False) -> None:
        tc_style = styles.get(section_name)
        if tc_style is None:
            return
        _A = NAMESPACE.DML_MAIN
        fill_container = tc_style.find(f"{{{_A}}}fill")
        fill = self._parse_fill(fill_container)
        if fill is not None:
            result["fill"] = fill

        tc_bdr = tc_style.find(f"{{{_A}}}tcBdr")
        if tc_bdr is None:
            return
        logical: dict[str, Border] = {}
        for side in ("left", "right", "top", "bottom", "insideH", "insideV"):
            wrapper = tc_bdr.find(f"{{{_A}}}{side}")
            line = wrapper.find(f"{{{_A}}}ln") if wrapper is not None else None
            border = self._border_from_line(line)
            if border is None:
                continue
            self._apply_default_border_width(border)
            logical[side] = border

        if whole_table:
            mapped = {
                "left": logical.get("left") if col_index == 0 else logical.get("insideV"),
                "right": (
                    logical.get("right")
                    if col_count and col_index >= col_count - 1
                    else logical.get("insideV")
                ),
                "top": logical.get("top") if row_index == 0 else logical.get("insideH"),
                "bottom": (
                    logical.get("bottom")
                    if row_count and row_index >= row_count - 1
                    else logical.get("insideH")
                ),
            }
            result["borders"].update(
                {side: border for side, border in mapped.items() if border is not None}
            )
            return

        for side in ("left", "right", "top", "bottom"):
            if side in logical:
                result["borders"][side] = logical[side]
        if "insideV" in logical:
            if col_index > 0:
                result["borders"]["left"] = logical["insideV"]
            if not col_count or col_index < col_count - 1:
                result["borders"]["right"] = logical["insideV"]
        if "insideH" in logical:
            if row_index > 0:
                result["borders"]["top"] = logical["insideH"]
            if not row_count or row_index < row_count - 1:
                result["borders"]["bottom"] = logical["insideH"]

    section_visual("wholeTbl", whole_table=True)

    first_row = parse_bool(tbl_pr.get("firstRow")) if tbl_pr is not None else None
    last_row = parse_bool(tbl_pr.get("lastRow")) if tbl_pr is not None else None
    first_col = parse_bool(tbl_pr.get("firstCol")) if tbl_pr is not None else None
    last_col = parse_bool(tbl_pr.get("lastCol")) if tbl_pr is not None else None
    band_row = parse_bool(tbl_pr.get("bandRow")) if tbl_pr is not None else None
    band_col = parse_bool(tbl_pr.get("bandCol")) if tbl_pr is not None else None

    if band_row:
        band_row_index = row_index - (1 if first_row else 0)
        section_visual("band1H" if band_row_index % 2 == 0 else "band2H")
    if band_col:
        band_col_index = col_index - (1 if first_col else 0)
        section_visual("band1V" if band_col_index % 2 == 0 else "band2V")
    if first_col and col_index == 0:
        section_visual("firstCol")
    if last_col and col_count and col_index >= col_count - 1:
        section_visual("lastCol")
    if first_row and row_index == 0:
        section_visual("firstRow")
    if last_row and row_count and row_index >= row_count - 1:
        section_visual("lastRow")

    if first_row and first_col and row_index == 0 and col_index == 0:
        section_visual("nwCell")
    if first_row and last_col and row_index == 0 and col_count and col_index >= col_count - 1:
        section_visual("neCell")
    if last_row and first_col and row_count and row_index >= row_count - 1 and col_index == 0:
        section_visual("swCell")
    if (
        last_row
        and last_col
        and row_count
        and col_count
        and row_index >= row_count - 1
        and col_index >= col_count - 1
    ):
        section_visual("seCell")

    return result

_table_cell_visual_style.__module__ = 'pptx2html.ir.builder'
_table_cell_visual_style.__qualname__ = 'PresentationBuilder._table_cell_visual_style'
