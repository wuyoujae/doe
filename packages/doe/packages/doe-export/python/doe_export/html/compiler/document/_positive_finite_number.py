# Origin: pptx2html/htmlir/compiler.py::_positive_finite_number
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import math

def _positive_finite_number(value: Any) -> float | None:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) and result > 0 else None

_positive_finite_number.__module__ = 'pptx2html.htmlir.compiler'
