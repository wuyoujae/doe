# Origin: pptx2html/htmlir/compiler.py::_css_text_frame_margins
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_nonnegative_length_pt import _css_nonnegative_length_pt

def _css_text_frame_margins(computed: dict[str, Any], visual_scale: float) -> dict[str, float]:
    return {
        "left": _css_nonnegative_length_pt(computed.get("paddingLeft"), visual_scale),
        "right": _css_nonnegative_length_pt(computed.get("paddingRight"), visual_scale),
        "top": _css_nonnegative_length_pt(computed.get("paddingTop"), visual_scale),
        "bottom": _css_nonnegative_length_pt(computed.get("paddingBottom"), visual_scale),
    }

_css_text_frame_margins.__module__ = 'pptx2html.htmlir.compiler'
