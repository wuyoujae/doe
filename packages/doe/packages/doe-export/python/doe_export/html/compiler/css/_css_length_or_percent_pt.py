# Origin: pptx2html/htmlir/compiler.py::_css_length_or_percent_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _css_length_or_percent_pt(value: Any, basis: float, axis_scale: float) -> float | None:
    raw = str(value or "").strip().lower()
    if not raw or raw in {"auto", "none", "normal"}:
        return None
    if raw.endswith("%"):
        try:
            return max(0.0, basis * float(raw[:-1]) / 100.0)
        except ValueError:
            return None
    px = _css_px(raw)
    if px <= 0:
        return None
    return px * axis_scale

_css_length_or_percent_pt.__module__ = 'pptx2html.htmlir.compiler'
