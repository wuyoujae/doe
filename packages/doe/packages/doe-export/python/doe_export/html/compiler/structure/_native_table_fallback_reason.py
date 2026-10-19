# Origin: pptx2html/htmlir/compiler.py::_native_table_fallback_reason
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import SKIP_TAGS, TABLE_NATIVE_TEXT_CHILD_TAGS, TABLE_TAGS
from doe_export.html.compiler.structure._belongs_to_table import _belongs_to_table
from doe_export.html.compiler.structure._path_has_table_cell_segment import _path_has_table_cell_segment

def _native_table_fallback_reason(
    table_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    table_path: str,
    table_paths: list[str],
) -> str | None:
    if not table_path:
        return "missing-table-path"

    for node in nodes:
        if node.get("nodeType") != "element":
            continue
        path = str(node.get("path") or "")
        if path == table_path or not _belongs_to_table(path, table_path, table_paths):
            continue
        tag = str(node.get("tag") or "").lower()
        if tag in TABLE_TAGS or tag in SKIP_TAGS:
            continue
        if not _path_has_table_cell_segment(path):
            continue
        if tag in TABLE_NATIVE_TEXT_CHILD_TAGS:
            continue
        return f"cell child <{tag}>"

    return None

_native_table_fallback_reason.__module__ = 'pptx2html.htmlir.compiler'
