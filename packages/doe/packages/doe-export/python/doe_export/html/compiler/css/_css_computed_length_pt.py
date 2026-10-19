# Origin: pptx2html/htmlir/compiler.py::_css_computed_length_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _css_computed_length_pt(value: Any, visual_scale: float) -> float | None:
    raw = str(value or "").strip().lower()
    if not raw or raw in {"normal", "auto", "none"}:
        return None
    if raw.endswith("%"):
        return None
    length_px = _css_px(raw)
    length_pt = length_px * visual_scale * 0.75
    if abs(length_pt) < 0.001:
        return None
    return round(length_pt, 3)

_css_computed_length_pt.__module__ = 'pptx2html.htmlir.compiler'
