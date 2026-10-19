# Origin: pptx2html/htmlir/compiler.py::_css_alpha_value
from __future__ import annotations

def _css_alpha_value(value: str) -> float:
    raw = str(value or "").strip().lower()
    if not raw or raw == "none":
        return 1.0
    try:
        alpha = float(raw[:-1]) / 100.0 if raw.endswith("%") else float(raw)
    except ValueError:
        return 1.0
    return max(0.0, min(1.0, alpha))

_css_alpha_value.__module__ = 'pptx2html.htmlir.compiler'
