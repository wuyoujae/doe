# Origin: pptx2html/htmlir/compiler.py::_css_letter_spacing_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_computed_length_pt import _css_computed_length_pt

def _css_letter_spacing_pt(computed: dict[str, Any], visual_scale: float) -> float | None:
    return _css_computed_length_pt(computed.get("letterSpacing"), visual_scale)

_css_letter_spacing_pt.__module__ = 'pptx2html.htmlir.compiler'
