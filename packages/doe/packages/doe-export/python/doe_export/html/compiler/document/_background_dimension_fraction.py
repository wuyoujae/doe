# Origin: pptx2html/htmlir/compiler.py::_background_dimension_fraction
from __future__ import annotations
from doe_export.html.compiler.shared import CSS_PX_TO_PT, math
from doe_export.html.compiler.css._css_float import _css_float

def _background_dimension_fraction(value: str, box_size_px: float) -> float | None:
    raw = str(value or "").strip().lower()
    if not raw or raw == "auto":
        return None
    if raw.endswith("%"):
        return _css_float(raw[:-1], 0.0) / 100.0
    if raw.endswith("pt"):
        return (_css_float(raw[:-2], 0.0) / CSS_PX_TO_PT) / max(0.001, box_size_px)
    if raw.endswith("px"):
        return _css_float(raw[:-2], 0.0) / max(0.001, box_size_px)
    numeric = _css_float(raw, math.nan)
    return numeric / max(0.001, box_size_px) if math.isfinite(numeric) else None

_background_dimension_fraction.__module__ = 'pptx2html.htmlir.compiler'
