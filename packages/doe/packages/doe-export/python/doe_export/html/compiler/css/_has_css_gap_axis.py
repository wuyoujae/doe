# Origin: pptx2html/htmlir/compiler.py::_has_css_gap_axis
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _has_css_gap_axis(value: Any) -> bool:
    raw = str(value or "").strip().lower()
    if not raw or raw == "normal":
        return False
    return abs(_css_px(raw)) > 0.01

_has_css_gap_axis.__module__ = 'pptx2html.htmlir.compiler'
