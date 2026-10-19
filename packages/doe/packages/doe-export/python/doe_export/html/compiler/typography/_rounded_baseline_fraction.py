# Origin: pptx2html/htmlir/compiler.py::_rounded_baseline_fraction
from __future__ import annotations
from doe_export.html.compiler.shared import math

def _rounded_baseline_fraction(value: float) -> float | None:
    if not math.isfinite(value) or abs(value) < 0.001:
        return None
    return round(max(-5.0, min(5.0, value)), 4)

_rounded_baseline_fraction.__module__ = 'pptx2html.htmlir.compiler'
