# Origin: pptx2html/server/pptx_writer.py::_ooxml_coord
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _ooxml_coord(value: Any) -> str:
    try:
        return str(int(round(float(value) * 1000.0)))
    except (TypeError, ValueError):
        return "0"

_ooxml_coord.__module__ = 'pptx2html.server.pptx_writer'
