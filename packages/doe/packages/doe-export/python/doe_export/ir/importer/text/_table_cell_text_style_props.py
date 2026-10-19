# Origin: pptx2html/ir/builder.py::PresentationBuilder._table_cell_text_style_props
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, parse_bool

def _table_cell_text_style_props(
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
    styles = self._table_text_styles.get(style_id)
    if not styles:
        return {}

    props: dict = {}

    def apply(key: str) -> None:
        style_props = styles.get(key)
        if style_props:
            props.update(style_props)

    apply("wholeTbl")

    first_row = parse_bool(tbl_pr.get("firstRow")) if tbl_pr is not None else None
    last_row = parse_bool(tbl_pr.get("lastRow")) if tbl_pr is not None else None
    first_col = parse_bool(tbl_pr.get("firstCol")) if tbl_pr is not None else None
    last_col = parse_bool(tbl_pr.get("lastCol")) if tbl_pr is not None else None
    band_row = parse_bool(tbl_pr.get("bandRow")) if tbl_pr is not None else None
    band_col = parse_bool(tbl_pr.get("bandCol")) if tbl_pr is not None else None

    if band_row:
        band_row_index = row_index - (1 if first_row else 0)
        apply("band1H" if band_row_index % 2 == 0 else "band2H")
    if band_col:
        band_col_index = col_index - (1 if first_col else 0)
        apply("band1V" if band_col_index % 2 == 0 else "band2V")
    if first_col and col_index == 0:
        apply("firstCol")
    if last_col and col_count and col_index >= col_count - 1:
        apply("lastCol")
    if first_row and row_index == 0:
        apply("firstRow")
    if last_row and row_count and row_index >= row_count - 1:
        apply("lastRow")

    if first_row and first_col and row_index == 0 and col_index == 0:
        apply("nwCell")
    if first_row and last_col and row_index == 0 and col_count and col_index >= col_count - 1:
        apply("neCell")
    if last_row and first_col and row_count and row_index >= row_count - 1 and col_index == 0:
        apply("swCell")
    if (
        last_row
        and last_col
        and row_count
        and col_count
        and row_index >= row_count - 1
        and col_index >= col_count - 1
    ):
        apply("seCell")

    return props

_table_cell_text_style_props.__module__ = 'pptx2html.ir.builder'
_table_cell_text_style_props.__qualname__ = 'PresentationBuilder._table_cell_text_style_props'
