# Origin: pptx2html/server/pptx_writer.py::_stop_pos_to_ooxml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _stop_pos_to_ooxml(value: Any) -> int:
    try:
        position = float(value)
    except (TypeError, ValueError):
        position = 0.0
    if position > 1:
        position = position / 100.0
    return max(0, min(100000, int(round(position * 100000))))

_stop_pos_to_ooxml.__module__ = 'pptx2html.server.pptx_writer'
