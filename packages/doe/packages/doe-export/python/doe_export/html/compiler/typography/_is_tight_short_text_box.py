# Origin: pptx2html/htmlir/compiler.py::_is_tight_short_text_box
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_float import _css_float

def _is_tight_short_text_box(node: dict[str, Any], text: str) -> bool:
    if len(text) > 24:
        return False
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    text_rect = node.get("textRect") if isinstance(node.get("textRect"), dict) else {}
    rect_width = _css_float(rect.get("width"), 0.0)
    text_width = _css_float(text_rect.get("width"), 0.0)
    if rect_width <= 0 or text_width <= 0:
        return False
    return abs(rect_width - text_width) <= max(2.0, rect_width * 0.03)

_is_tight_short_text_box.__module__ = 'pptx2html.htmlir.compiler'
