# Origin: pptx2html/htmlir/compiler.py::_shape_descendant_nodes
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _shape_descendant_nodes(
    root_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    shape_paths: set[str],
) -> list[dict[str, Any]]:
    root_path = str(root_node.get("path") or "")
    nested_shape_paths = {
        path
        for path in shape_paths
        if path != root_path and path.startswith(root_path + " > ")
    }
    return [
        node
        for node in nodes
        if str(node.get("path") or "").startswith(root_path + " > ")
        and not any(
            str(node.get("path") or "").startswith(path)
            for path in nested_shape_paths
        )
    ]

_shape_descendant_nodes.__module__ = 'pptx2html.htmlir.compiler'
