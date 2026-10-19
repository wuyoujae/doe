# Origin: pptx2html/htmlir/compiler.py::_table_last_row_is_footer
from __future__ import annotations
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.document._path_has_segment import _path_has_segment

def _table_last_row_is_footer(planned_rows: list[list[_HtmlTableCellPlan]]) -> bool | None:
    if not planned_rows:
        return None
    return any(plan.node is not None and _path_has_segment(str(plan.node.get("path") or ""), "tfoot") for plan in planned_rows[-1])

_table_last_row_is_footer.__module__ = 'pptx2html.htmlir.compiler'
