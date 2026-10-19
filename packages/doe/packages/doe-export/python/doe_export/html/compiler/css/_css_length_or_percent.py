# Origin: pptx2html/htmlir/compiler.py::_css_length_or_percent
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px

def _css_length_or_percent(value: Any, basis: float, axis_scale: float = 1.0) -> float:
    raw = str(value or "").strip().lower()
    if raw.endswith("%"):
        return basis * _css_float(raw[:-1], 0.0) / 100.0
    return _css_px(raw) * axis_scale

_css_length_or_percent.__module__ = 'pptx2html.htmlir.compiler'
