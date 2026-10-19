# Origin: pptx2html/server/ooxml_pptx_writer.py::safe_int
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def safe_int(value: Any, fallback: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback

safe_int.__module__ = 'pptx2html.server.ooxml_pptx_writer'
