# Origin: pptx2html/htmlir/compiler.py::_canonical_paragraph_layout_nodes
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TextFrame
from doe_export.html.compiler.typography._canonical_paragraph_is_rendered import _canonical_paragraph_is_rendered
from doe_export.html.compiler.typography._canonical_paragraph_node_is_blank import _canonical_paragraph_node_is_blank
from doe_export.html.compiler.typography._paragraph_has_semantic_text import _paragraph_has_semantic_text
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant
from doe_export.html.compiler.typography._validated_visual_text_layout import _validated_visual_text_layout

def _canonical_paragraph_layout_nodes(
    container_node: dict[str, Any],
    nodes: list[dict[str, Any]],
    text_frame: TextFrame,
) -> list[tuple[int, dict[str, Any]]] | None:
    if len(text_frame.paragraphs) == 1 and _validated_visual_text_layout(container_node) is not None:
        return [(0, container_node)]
    container_path = str(container_node.get("path") or "")
    paragraph_nodes: list[dict[str, Any]] = []
    for node in nodes:
        path = str(node.get("path") or "")
        if not _path_is_descendant(path, container_path):
            continue
        attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
        classes = str(attrs.get("class") or "").split()
        if "pptx-paragraph" in classes:
            paragraph_nodes.append(node)
    rendered_paragraph_indices = [
        index
        for index, paragraph in enumerate(text_frame.paragraphs)
        if _canonical_paragraph_is_rendered(paragraph)
    ]
    if len(paragraph_nodes) != len(rendered_paragraph_indices):
        return None
    result: list[tuple[int, dict[str, Any]]] = []
    for paragraph_index, node in zip(rendered_paragraph_indices, paragraph_nodes):
        paragraph = text_frame.paragraphs[paragraph_index]
        if _paragraph_has_semantic_text(paragraph):
            if _validated_visual_text_layout(node) is None:
                return None
            result.append((paragraph_index, node))
        elif not _canonical_paragraph_node_is_blank(node):
            return None
    return result

_canonical_paragraph_layout_nodes.__module__ = 'pptx2html.htmlir.compiler'
