# Origin: pptx2html/server/ooxml_pptx_writer.py::safe_float
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import math

def safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return fallback
    return result if math.isfinite(result) else fallback

safe_float.__module__ = 'pptx2html.server.ooxml_pptx_writer'
