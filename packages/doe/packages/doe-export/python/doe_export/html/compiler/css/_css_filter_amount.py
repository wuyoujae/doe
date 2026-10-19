# Origin: pptx2html/htmlir/compiler.py::_css_filter_amount
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_float import _css_float

def _css_filter_amount(value: Any, default: float = 1.0) -> float:
    raw = str(value or "").strip().lower()
    if not raw:
        return max(0.0, min(1.0, default))
    if raw.endswith("%"):
        return max(0.0, min(1.0, _css_float(raw[:-1], default * 100.0) / 100.0))
    return max(0.0, min(1.0, _css_float(raw, default)))

_css_filter_amount.__module__ = 'pptx2html.htmlir.compiler'
