# Origin: pptx2html/htmlir/compiler.py::_first_font_family
from __future__ import annotations

def _first_font_family(value: str) -> str:
    first = value.split(",", 1)[0].strip().strip("\"'")
    return first or "Arial"

_first_font_family.__module__ = 'pptx2html.htmlir.compiler'
