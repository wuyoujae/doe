# Origin: pptx2html/server/ooxml_pptx_writer.py::qn
from __future__ import annotations

def qn(namespace: str, tag: str) -> str:
    return f"{{{namespace}}}{tag}"

qn.__module__ = 'pptx2html.server.ooxml_pptx_writer'
