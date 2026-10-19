# Origin: pptx2html/htmlir/compiler.py::_reconcile_shape_table
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shape
from doe_export.html.compiler.css._reconcile_table_cell_style import _reconcile_table_cell_style
from doe_export.html.compiler.typography._reconcile_table_cell_text import _reconcile_table_cell_text
from doe_export.html.compiler.structure._shape_descendant_nodes import _shape_descendant_nodes

def _reconcile_shape_table(
    shape: Shape,
    root_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    shape_paths: set[str],
) -> bool:
    if shape.table is None:
        return True
    descendants = _shape_descendant_nodes(root_node, nodes, shape_paths)
    table_nodes = []
    for node in descendants:
        attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
        if (
            str(node.get("tag") or "").lower() == "table"
            and "pptx-table" in str(attrs.get("class") or "").split()
        ):
            table_nodes.append(node)
    if len(table_nodes) != 1:
        return False
    table_path = str(table_nodes[0].get("path") or "")
    row_nodes = [
        node
        for node in descendants
        if str(node.get("tag") or "").lower() == "tr"
        and str(node.get("path") or "").startswith(table_path + " > ")
    ]
    if len(row_nodes) != len(shape.table.rows):
        return False
    for row, row_node in zip(shape.table.rows, row_nodes, strict=True):
        row_path = str(row_node.get("path") or "")
        cell_nodes = [
            node
            for node in descendants
            if str(node.get("tag") or "").lower() in {"td", "th"}
            and str(node.get("path") or "").rsplit(" > ", 1)[0] == row_path
        ]
        visible_cells = [cell for cell in row if not cell.h_merge and not cell.v_merge]
        if len(cell_nodes) != len(visible_cells):
            return False
        for cell, cell_node in zip(visible_cells, cell_nodes, strict=True):
            if not _reconcile_table_cell_text(cell, cell_node, descendants):
                return False
            _reconcile_table_cell_style(cell, cell_node)
    return True

_reconcile_shape_table.__module__ = 'pptx2html.htmlir.compiler'
