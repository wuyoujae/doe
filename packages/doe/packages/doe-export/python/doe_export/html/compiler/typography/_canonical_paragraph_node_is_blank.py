# Origin: pptx2html/htmlir/compiler.py::_canonical_paragraph_node_is_blank
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _canonical_paragraph_node_is_blank(node: dict[str, Any]) -> bool:
    records = node.get("richTextRuns")
    if not isinstance(records, list):
        return False
    for record in records:
        if not isinstance(record, dict):
            return False
        kind = str(record.get("kind") or "text")
        if kind == "text" and str(record.get("text") or "").strip():
            return False
        if kind == "break" and str(record.get("breakKind") or "line") != "line":
            return False
        if kind not in {"text", "break"}:
            return False
    return True

_canonical_paragraph_node_is_blank.__module__ = 'pptx2html.htmlir.compiler'
