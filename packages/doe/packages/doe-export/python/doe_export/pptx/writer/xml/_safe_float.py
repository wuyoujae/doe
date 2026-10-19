# Origin: pptx2html/server/pptx_writer.py::_safe_float
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import math

def _safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return fallback
    return result if math.isfinite(result) else fallback

_safe_float.__module__ = 'pptx2html.server.pptx_writer'
