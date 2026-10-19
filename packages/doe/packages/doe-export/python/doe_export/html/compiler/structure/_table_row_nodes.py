# Origin: pptx2html/htmlir/compiler.py::_table_row_nodes
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table

def _table_row_nodes(table_path: str, nodes: list[dict[str, Any]], table_paths: list[str]) -> list[dict[str, Any]]:
    return [
        node
        for node in nodes
        if str(node.get("tag") or "").lower() == "tr"
        and bool(node.get("visible"))
        and _belongs_to_table(str(node.get("path") or ""), table_path, table_paths)
    ]

_table_row_nodes.__module__ = 'pptx2html.htmlir.compiler'
