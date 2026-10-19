# Origin: pptx2html/htmlir/compiler.py::_apply_list_paragraph_format
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Paragraph
from doe_export.html.compiler.typography._bullet_info_from_list_node import _bullet_info_from_list_node
from doe_export.html.compiler.document._list_indent_metrics import _list_indent_metrics

def _apply_list_paragraph_format(
    node: dict[str, Any],
    paragraphs: list[Paragraph],
    visual_scale: float,
) -> None:
    if str(node.get("tag") or "").lower() != "li" or not paragraphs:
        return
    bullet = _bullet_info_from_list_node(node, visual_scale)
    if bullet is None:
        return
    first = paragraphs[0]
    margin_left, indent = _list_indent_metrics(node)
    first.bullet = bullet
    first.margin_left = margin_left
    first.indent = indent

_apply_list_paragraph_format.__module__ = 'pptx2html.htmlir.compiler'
