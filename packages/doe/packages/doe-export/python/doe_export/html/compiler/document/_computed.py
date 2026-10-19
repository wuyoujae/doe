# Origin: pptx2html/htmlir/compiler.py::_computed
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _computed(node: dict[str, Any]) -> dict[str, Any]:
    return node.get("computed") if isinstance(node.get("computed"), dict) else {}

_computed.__module__ = 'pptx2html.htmlir.compiler'
