# Origin: pptx2html/htmlir/compiler.py::_normalize_rotation_degrees
from __future__ import annotations
from doe_export.html.compiler.shared import math

def _normalize_rotation_degrees(value: float) -> float | None:
    if not math.isfinite(value):
        return None
    normalized = value % 360.0
    if normalized > 180.0:
        normalized -= 360.0
    if abs(normalized) < 0.001:
        return None
    return round(normalized, 3)

_normalize_rotation_degrees.__module__ = 'pptx2html.htmlir.compiler'
