# Origin: pptx2html/htmlir/compiler.py::_text_for_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import GENERIC_TEXT_CONTAINER_TAGS, INLINE_TEXT_TAGS, TEXT_TAGS
from doe_export.html.compiler.typography._ancestor_will_aggregate_inline_text import _ancestor_will_aggregate_inline_text
from doe_export.html.compiler.typography._clean_text_for_computed import _clean_text_for_computed
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.typography._has_only_inline_text_descendants import _has_only_inline_text_descendants
from doe_export.html.compiler.typography._is_layout_text_container import _is_layout_text_container

def _text_for_node(
    node: dict[str, Any],
    element_paths: set[str],
    nodes_by_path: dict[str, dict[str, Any]] | None = None,
) -> str:
    tag = str(node.get("tag") or "").lower()
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    if str(attrs.get("aria-hidden") or "").lower() == "true" and not (node.get("directText") or "").strip():
        return ""
    computed = _computed(node)
    raw = str(node.get("visualTextRaw") or node.get("innerTextRaw") or "")
    text = _clean_text_for_computed(raw, computed)
    if not text:
        return ""
    display = str(computed.get("display") or "").strip().lower()
    path = str(node.get("path") or "")
    if isinstance(node.get("anonymousTextRect"), dict):
        return _clean_text_for_computed(str(node.get("directText") or ""), computed)
    has_element_child = any(candidate.startswith(path + " > ") for candidate in element_paths if candidate != path)
    if tag in INLINE_TEXT_TAGS:
        if has_element_child and not _has_only_inline_text_descendants(path, nodes_by_path or {}):
            return _clean_text_for_computed(str(node.get("directText") or ""), computed)
        if display.startswith("inline"):
            return "" if _ancestor_will_aggregate_inline_text(node, nodes_by_path or {}) else text
        return text
    if tag in TEXT_TAGS:
        if not has_element_child:
            return text
        if _has_only_inline_text_descendants(path, nodes_by_path or {}):
            return text
        direct = _clean_text_for_computed(str(node.get("directText") or ""), computed)
        return direct
    if tag == "li":
        direct = _clean_text_for_computed(str(node.get("directText") or ""), computed)
        if not has_element_child:
            return text
        if not _is_layout_text_container(computed) and _has_only_inline_text_descendants(path, nodes_by_path or {}):
            return text
        return direct
    direct = _clean_text_for_computed(str(node.get("directText") or ""), computed)
    if not direct:
        if (
            tag in GENERIC_TEXT_CONTAINER_TAGS
            and not _is_layout_text_container(computed)
            and _has_only_inline_text_descendants(path, nodes_by_path or {})
        ):
            return text
        return ""
    if has_element_child:
        if (
            tag in GENERIC_TEXT_CONTAINER_TAGS
            and not _is_layout_text_container(computed)
            and _has_only_inline_text_descendants(path, nodes_by_path or {})
        ):
            return text
        return ""
    if tag in GENERIC_TEXT_CONTAINER_TAGS:
        return direct
    return ""

_text_for_node.__module__ = 'pptx2html.htmlir.compiler'
