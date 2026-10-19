# Origin: pptx2html/htmlir/compiler.py::_first_css_color
from __future__ import annotations
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_color import _css_color

def _first_css_color(value: str) -> tuple[str, float] | None:
    match = re.search(r"rgba?\([^)]+\)|color\([^)]+\)|#[0-9a-fA-F]{3,8}", value or "", re.IGNORECASE)
    return _css_color(match.group(0)) if match else None

_first_css_color.__module__ = 'pptx2html.htmlir.compiler'
