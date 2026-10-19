# Origin: pptx2html/server/ooxml_pptx_writer.py::finite_number
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import math

def finite_number(value: Any) -> float:
    try:
        number = float(value or 0)
    except (TypeError, ValueError):
        return 0.0
    return number if math.isfinite(number) else 0.0

finite_number.__module__ = 'pptx2html.server.ooxml_pptx_writer'
