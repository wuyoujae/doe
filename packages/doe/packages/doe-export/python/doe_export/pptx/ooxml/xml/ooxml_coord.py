# Origin: pptx2html/server/ooxml_pptx_writer.py::ooxml_coord
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def ooxml_coord(value: Any) -> str:
    try:
        return str(int(round(float(value) * 1000.0)))
    except (TypeError, ValueError):
        return "0"

ooxml_coord.__module__ = 'pptx2html.server.ooxml_pptx_writer'
