# Origin: pptx2html/htmlir/compiler.py::_stable_identity_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.structure._parent_node import _parent_node

def _stable_identity_diagnostics(
    node: dict[str, Any],
    nodes_by_path: dict[str, dict[str, Any]],
) -> list[str]:
    current: dict[str, Any] | None = node
    direct = True
    while current is not None:
        attrs = (
            current.get("attributes")
            if isinstance(current.get("attributes"), dict)
            else {}
        )
        element_id = str(attrs.get("data-yrkie-element-id") or "").strip()
        if element_id:
            return [
                f"yrkie:element-id={element_id}",
                (
                    "yrkie:element-owner=direct"
                    if direct
                    else "yrkie:element-owner=inherited"
                ),
            ]
        current = _parent_node(current, nodes_by_path)
        direct = False
    return []

_stable_identity_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
