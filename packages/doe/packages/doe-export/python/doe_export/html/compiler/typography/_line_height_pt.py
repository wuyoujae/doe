# Origin: pptx2html/htmlir/compiler.py::_line_height_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_px import _css_px

def _line_height_pt(value: Any, font_size_px: float, font_size_pt: float, visual_scale: float) -> float:
    raw = str(value or "").strip().lower()
    if raw.endswith("px"):
        return max(1.0, _css_px(raw) * visual_scale * 0.75)
    if raw and raw != "normal":
        multiplier = _css_float(raw, 0)
        if multiplier > 0:
            return font_size_pt * multiplier
    return font_size_pt * 1.2

_line_height_pt.__module__ = 'pptx2html.htmlir.compiler'
