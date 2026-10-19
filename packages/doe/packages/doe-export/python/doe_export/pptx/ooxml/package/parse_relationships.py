# Origin: pptx2html/server/ooxml_pptx_writer.py::parse_relationships
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET, REL, parse_xml
from doe_export.pptx.ooxml.xml.qn import qn

def parse_relationships(data: bytes | None) -> ET.Element:
    if data:
        return parse_xml(data)
    return ET.Element(qn(REL, "Relationships"))

parse_relationships.__module__ = 'pptx2html.server.ooxml_pptx_writer'
