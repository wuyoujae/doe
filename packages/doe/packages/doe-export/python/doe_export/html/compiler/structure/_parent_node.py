# Origin: pptx2html/htmlir/compiler.py::_parent_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import _parent_path
from doe_export.html.compiler.document._parent_path import _parent_path

def _parent_node(node: dict[str, Any], nodes_by_path: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    parent_path = _parent_path(str(node.get("path") or ""))
    return nodes_by_path.get(parent_path) if parent_path else None

_parent_node.__module__ = 'pptx2html.htmlir.compiler'
