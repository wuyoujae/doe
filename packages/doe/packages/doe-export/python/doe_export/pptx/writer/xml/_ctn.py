# Origin: pptx2html/server/pptx_writer.py::_ctn
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement

def _ctn(ctn_id: str, attrs: dict[str, str]) -> Any:
    elem = OxmlElement("p:cTn")
    elem.set("id", str(ctn_id))
    for key, value in attrs.items():
        if value is not None:
            elem.set(key, str(value))
    return elem

_ctn.__module__ = 'pptx2html.server.pptx_writer'
