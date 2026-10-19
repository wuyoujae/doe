# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_changed
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.xml.canonical import canonical

def shape_changed(current: Any, original: Any) -> bool:
    return canonical(current) != canonical(original)

shape_changed.__module__ = 'pptx2html.server.ooxml_pptx_writer'
