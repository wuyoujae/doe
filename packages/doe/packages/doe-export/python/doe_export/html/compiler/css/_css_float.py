# Origin: pptx2html/htmlir/compiler.py::_css_float
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_float(value: Any, fallback: float) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return fallback

_css_float.__module__ = 'pptx2html.htmlir.compiler'
