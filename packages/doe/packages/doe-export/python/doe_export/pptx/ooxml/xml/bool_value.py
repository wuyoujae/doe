# Origin: pptx2html/server/ooxml_pptx_writer.py::bool_value
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def bool_value(value: Any) -> str:
    return "1" if bool(value) else "0"

bool_value.__module__ = 'pptx2html.server.ooxml_pptx_writer'
