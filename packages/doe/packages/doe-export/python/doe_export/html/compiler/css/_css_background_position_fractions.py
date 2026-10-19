# Origin: pptx2html/htmlir/compiler.py::_css_background_position_fractions
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_object_position_fractions import _css_object_position_fractions

def _css_background_position_fractions(value: Any) -> tuple[float, float]:
    raw = str(value or "").strip()
    return _css_object_position_fractions(raw) if raw else (0.0, 0.0)

_css_background_position_fractions.__module__ = 'pptx2html.htmlir.compiler'
