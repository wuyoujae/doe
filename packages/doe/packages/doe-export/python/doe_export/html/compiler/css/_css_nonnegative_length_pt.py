# Origin: pptx2html/htmlir/compiler.py::_css_nonnegative_length_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _css_nonnegative_length_pt(value: Any, visual_scale: float) -> float:
    length = max(0.0, _css_px(value) * visual_scale * 0.75)
    return round(length, 3)

_css_nonnegative_length_pt.__module__ = 'pptx2html.htmlir.compiler'
