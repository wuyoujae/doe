# Origin: pptx2html/server/pptx_writer.py::_signed_percent_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import math

def _signed_percent_to_ooxml(value: Any) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    if not math.isfinite(number):
        number = 0.0
    return max(-(2**31), min(2**31 - 1, int(round(number * 100000))))

_signed_percent_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
