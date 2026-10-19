# Origin: pptx2html/htmlir/compiler.py::_table_caption_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import _parent_path
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table
from doe_export.html.compiler.document._parent_path import _parent_path

def _table_caption_node(table_path: str, nodes: list[dict[str, Any]], table_paths: list[str]) -> dict[str, Any] | None:
    captions = [
        node
        for node in nodes
        if str(node.get("tag") or "").lower() == "caption"
        and bool(node.get("visible"))
        and _belongs_to_table(str(node.get("path") or ""), table_path, table_paths)
    ]
    for node in captions:
        if _parent_path(str(node.get("path") or "")) == table_path:
            return node
    return captions[0] if captions else None

_table_caption_node.__module__ = 'pptx2html.htmlir.compiler'
