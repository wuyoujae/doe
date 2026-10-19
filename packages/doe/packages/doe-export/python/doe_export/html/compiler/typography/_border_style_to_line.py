# Origin: pptx2html/htmlir/compiler.py::_border_style_to_line
from __future__ import annotations

def _border_style_to_line(style: str) -> tuple[str | None, str | None]:
    normalized = style.strip().lower()
    if normalized == "dashed":
        return "dash", None
    if normalized == "dotted":
        return "dot", None
    if normalized == "double":
        return "solid", "dbl"
    return "solid", None

_border_style_to_line.__module__ = 'pptx2html.htmlir.compiler'
