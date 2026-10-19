# Origin: pptx2html/server/pptx_writer.py::_percent_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _percent_to_ooxml(value: Any) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    return max(0, min(100000, int(round(number * 100000))))

_percent_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
