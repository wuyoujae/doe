# Origin: pptx2html/htmlir/compiler.py::_svg_line_join
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _svg_line_join(value: Any) -> str | None:
    raw = str(value or "").strip().lower()
    if raw == "round":
        return "round"
    if raw == "bevel":
        return "bevel"
    if raw == "miter":
        return "miter"
    return None

_svg_line_join.__module__ = 'pptx2html.htmlir.compiler'
