# Origin: pptx2html/htmlir/compiler.py::_position_token_fraction
from __future__ import annotations
from doe_export.html.compiler.shared import math
from doe_export.html.compiler.css._css_float import _css_float

def _position_token_fraction(token: str, *, axis: str) -> float:
    raw = str(token or "").strip().lower()
    if raw in {"left", "top"}:
        return 0.0
    if raw in {"right", "bottom"}:
        return 1.0
    if raw == "center":
        return 0.5
    if raw.endswith("%"):
        return max(0.0, min(1.0, _css_float(raw[:-1], 50.0) / 100.0))
    numeric = _css_float(raw, math.nan)
    if math.isfinite(numeric):
        if "%" in raw:
            return max(0.0, min(1.0, numeric / 100.0))
        if axis == "x":
            return 0.0 if numeric < 0 else 0.5
    return 0.5

_position_token_fraction.__module__ = 'pptx2html.htmlir.compiler'
