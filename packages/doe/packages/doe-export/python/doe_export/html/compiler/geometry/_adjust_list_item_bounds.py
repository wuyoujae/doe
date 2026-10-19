# Origin: pptx2html/htmlir/compiler.py::_adjust_list_item_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.document._list_has_custom_marker import _list_has_custom_marker
from doe_export.html.compiler.document._list_indent_metrics import _list_indent_metrics

def _adjust_list_item_bounds(node: dict[str, Any], bounds: Bounds) -> Bounds:
    if str(node.get("tag") or "").lower() != "li" or not isinstance(node.get("list"), dict):
        return bounds
    list_info = node.get("list") or {}
    style = str(list_info.get("listStyleType") or "").strip().lower()
    if style in {"none", "hidden"} and not _list_has_custom_marker(list_info):
        return bounds
    marker_width, _ = _list_indent_metrics(node)
    left_shift = min(marker_width, max(0.0, bounds.left))
    return Bounds(
        round(bounds.left - left_shift, 3),
        bounds.top,
        round(bounds.width + left_shift, 3),
        bounds.height,
    )

_adjust_list_item_bounds.__module__ = 'pptx2html.htmlir.compiler'
