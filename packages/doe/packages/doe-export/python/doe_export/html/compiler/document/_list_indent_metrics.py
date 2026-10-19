# Origin: pptx2html/htmlir/compiler.py::_list_indent_metrics
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _list_indent_metrics(node: dict[str, Any]) -> tuple[float, float]:
    list_info = node.get("list") if isinstance(node.get("list"), dict) else {}
    kind = str(list_info.get("kind") or "").strip().lower()
    if kind == "ordered":
        return 30.0, -22.0
    return 22.0, -16.0

_list_indent_metrics.__module__ = 'pptx2html.htmlir.compiler'
