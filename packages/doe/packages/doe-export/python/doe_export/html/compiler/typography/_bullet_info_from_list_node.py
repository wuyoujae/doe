# Origin: pptx2html/htmlir/compiler.py::_bullet_info_from_list_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import BulletInfo
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.typography._custom_marker_bullet_info import _custom_marker_bullet_info
from doe_export.html.compiler.typography._ordered_bullet_scheme import _ordered_bullet_scheme
from doe_export.html.compiler.typography._unordered_bullet_char import _unordered_bullet_char

def _bullet_info_from_list_node(node: dict[str, Any], visual_scale: float) -> BulletInfo | None:
    list_info = node.get("list") if isinstance(node.get("list"), dict) else None
    if not list_info:
        return None
    custom_marker = _custom_marker_bullet_info(list_info, node, visual_scale)
    if custom_marker is not None:
        return custom_marker
    style = str(list_info.get("listStyleType") or "").strip().lower()
    if style in {"none", "hidden"}:
        return None
    kind = str(list_info.get("kind") or "").strip().lower()
    if kind == "ordered":
        return BulletInfo(
            kind="auto",
            auto_number_scheme=_ordered_bullet_scheme(style),
            start_at=max(1, int(_css_float(list_info.get("ordinal"), 1))),
            follows_text_color=True,
            follows_text_font=True,
            follows_text_size=True,
        )
    return BulletInfo(
        kind="char",
        char=_unordered_bullet_char(style),
        follows_text_color=True,
        follows_text_font=True,
        follows_text_size=True,
    )

_bullet_info_from_list_node.__module__ = 'pptx2html.htmlir.compiler'
