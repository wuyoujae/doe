# Origin: pptx2html/htmlir/compiler.py::_table_vertical_align
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed

def _table_vertical_align(node: dict[str, Any]) -> str:
    raw = str(_computed(node).get("verticalAlign") or "").strip().lower()
    if raw in {"middle", "center", "central"}:
        return "mid"
    if raw in {"bottom", "text-bottom"}:
        return "bot"
    return "top"

_table_vertical_align.__module__ = 'pptx2html.htmlir.compiler'
