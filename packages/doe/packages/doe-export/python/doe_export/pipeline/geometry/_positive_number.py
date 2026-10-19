# Origin: pptx_pipeline.py::_positive_number
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import math

def _positive_number(value: Any, fallback: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    return number if math.isfinite(number) and number > 0 else fallback

_positive_number.__module__ = 'pptx_pipeline'
