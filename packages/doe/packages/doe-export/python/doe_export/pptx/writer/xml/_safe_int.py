# Origin: pptx2html/server/pptx_writer.py::_safe_int
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _safe_int(value: Any, fallback: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback

_safe_int.__module__ = 'pptx2html.server.pptx_writer'
