# Origin: pptx2html/htmlir/compiler.py::_table_cell_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._clean_text_for_computed import _clean_text_for_computed
from doe_export.html.compiler.document._computed import _computed

def _table_cell_text(node: dict[str, Any]) -> str:
    computed = _computed(node)
    raw = str(node.get("visualTextRaw") or node.get("innerTextRaw") or node.get("innerText") or "")
    return _clean_text_for_computed(raw, computed)

_table_cell_text.__module__ = 'pptx2html.htmlir.compiler'
