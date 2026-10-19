# Origin: pptx2html/htmlir/compiler.py::_unordered_bullet_char
from __future__ import annotations

def _unordered_bullet_char(style: str) -> str:
    normalized = style.replace("_", "-")
    if normalized == "circle":
        return "\u25e6"
    if normalized == "square":
        return "\u25aa"
    return "\u2022"

_unordered_bullet_char.__module__ = 'pptx2html.htmlir.compiler'
