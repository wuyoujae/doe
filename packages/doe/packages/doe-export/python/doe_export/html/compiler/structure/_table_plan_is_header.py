# Origin: pptx2html/htmlir/compiler.py::_table_plan_is_header
from __future__ import annotations
from doe_export.html.compiler.structure._HtmlTableCellPlan import _HtmlTableCellPlan
from doe_export.html.compiler.document._path_has_segment import _path_has_segment

def _table_plan_is_header(plan: _HtmlTableCellPlan) -> bool:
    if plan.node is None:
        return False
    return str(plan.node.get("tag") or "").lower() == "th" or _path_has_segment(str(plan.node.get("path") or ""), "thead")

_table_plan_is_header.__module__ = 'pptx2html.htmlir.compiler'
