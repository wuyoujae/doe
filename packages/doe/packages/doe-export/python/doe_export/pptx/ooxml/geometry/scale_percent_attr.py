# Origin: pptx2html/server/ooxml_pptx_writer.py::scale_percent_attr
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def scale_percent_attr(value: Any) -> str:
    return str(int(round(max(0.0, safe_float(value, 0.0)) * 100000)))

scale_percent_attr.__module__ = 'pptx2html.server.ooxml_pptx_writer'
