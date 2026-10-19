# Origin: pptx2html/htmlir/compiler.py::_list_has_custom_marker
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._marker_text_from_content import _marker_text_from_content

def _list_has_custom_marker(list_info: dict[str, Any]) -> bool:
    marker = list_info.get("marker") if isinstance(list_info.get("marker"), dict) else None
    if not marker:
        return False
    return _marker_text_from_content(str(marker.get("content") or ""), list_info) is not None

_list_has_custom_marker.__module__ = 'pptx2html.htmlir.compiler'
