# Origin: pptx2html/htmlir/compiler.py::_ancestor_will_aggregate_inline_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import GENERIC_TEXT_CONTAINER_TAGS, INLINE_TEXT_TAGS, TEXT_TAGS
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.typography._has_only_inline_text_descendants import _has_only_inline_text_descendants
from doe_export.html.compiler.typography._is_layout_text_container import _is_layout_text_container
from doe_export.html.compiler.structure._parent_node import _parent_node

def _ancestor_will_aggregate_inline_text(
    node: dict[str, Any],
    nodes_by_path: dict[str, dict[str, Any]],
) -> bool:
    ancestor = _parent_node(node, nodes_by_path)
    visited: set[str] = set()
    while ancestor is not None:
        ancestor_path = str(ancestor.get("path") or "")
        if not ancestor_path or ancestor_path in visited:
            return False
        visited.add(ancestor_path)

        ancestor_tag = str(ancestor.get("tag") or "").lower()
        ancestor_computed = _computed(ancestor)
        if ancestor_tag in TEXT_TAGS:
            return True
        if ancestor_tag in INLINE_TEXT_TAGS:
            display = str(ancestor_computed.get("display") or "").strip().lower()
            if display.startswith("inline"):
                ancestor = _parent_node(ancestor, nodes_by_path)
                continue
            return True
        if ancestor_tag == "li":
            return (
                not _is_layout_text_container(ancestor_computed)
                and _has_only_inline_text_descendants(ancestor_path, nodes_by_path)
            )
        return (
            ancestor_tag in GENERIC_TEXT_CONTAINER_TAGS
            and not _is_layout_text_container(ancestor_computed)
            and _has_only_inline_text_descendants(ancestor_path, nodes_by_path)
        )
    return False

_ancestor_will_aggregate_inline_text.__module__ = 'pptx2html.htmlir.compiler'
