# Origin: pptx2html/server/pptx_writer.py::_format_motion_value
from __future__ import annotations

def _format_motion_value(value: float) -> str:
    text = f"{value:.6f}".rstrip("0").rstrip(".")
    return text or "0"

_format_motion_value.__module__ = 'pptx2html.server.pptx_writer'
