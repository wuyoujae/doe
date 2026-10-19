# Origin: pptx2html/server/pptx_writer.py::_bool_to_xml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _bool_to_xml(value: Any) -> str:
    return "1" if bool(value) else "0"

_bool_to_xml.__module__ = 'pptx2html.server.pptx_writer'
