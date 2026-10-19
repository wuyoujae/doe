# Origin: pptx2html/htmlir/compiler.py::_table_first_row_is_header
from __future__ import annotations
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.structure._table_plan_is_header import _table_plan_is_header

def _table_first_row_is_header(planned_rows: list[list[_HtmlTableCellPlan]]) -> bool | None:
    if not planned_rows:
        return None
    return any(_table_plan_is_header(plan) for plan in planned_rows[0])

_table_first_row_is_header.__module__ = 'pptx2html.htmlir.compiler'
