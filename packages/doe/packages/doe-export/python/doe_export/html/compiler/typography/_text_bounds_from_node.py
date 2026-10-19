# Origin: pptx2html/htmlir/compiler.py::_text_bounds_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, math

def _text_bounds_from_node(node: dict[str, Any], sx: float, sy: float) -> Bounds | None:
    rect = node.get("textRect") if isinstance(node.get("textRect"), dict) else {}
    if not rect:
        return None
    try:
        left = float(rect.get("left")) * sx
        top = float(rect.get("top")) * sy
        width = float(rect.get("width")) * sx
        height = float(rect.get("height")) * sy
    except (TypeError, ValueError):
        return None
    if not all(math.isfinite(value) for value in (left, top, width, height)):
        return None
    return Bounds(round(left, 3), round(top, 3), round(max(0.0, width), 3), round(max(0.0, height), 3))

_text_bounds_from_node.__module__ = 'pptx2html.htmlir.compiler'
