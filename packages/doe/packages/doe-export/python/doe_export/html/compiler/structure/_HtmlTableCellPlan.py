# Origin: pptx2html/htmlir/compiler.py::_HtmlTableCellPlan
from __future__ import annotations
from doe_export.html.compiler.shared import dataclass

@dataclass
class _HtmlTableCellPlan:
    node: dict[str, Any] | None
    row_node: dict[str, Any] | None = None
    row_index: int = 0
    col_index: int = 0
    colspan: int = 1
    rowspan: int = 1
    h_merge: bool = False
    v_merge: bool = False

_HtmlTableCellPlan.__module__ = 'pptx2html.htmlir.compiler'
