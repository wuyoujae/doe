# Origin: pptx2html/htmlir/compiler.py::_css_rtl
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_direction import _css_direction

def _css_rtl(computed: dict[str, Any]) -> bool | None:
    return True if _css_direction(computed) == "rtl" else None

_css_rtl.__module__ = 'pptx2html.htmlir.compiler'
