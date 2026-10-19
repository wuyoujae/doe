# Origin: pptx2html/server/ooxml_pptx_writer.py::find_or_create
from __future__ import annotations
from doe_export.pptx.ooxml.shared import A, ET, P
from doe_export.pptx.ooxml.xml.qn import qn

def find_or_create(root: ET.Element, path: list[tuple[str, str]]) -> ET.Element:
    current = root
    for prefix, tag in path:
        namespace = P if prefix == "p" else A
        qtag = qn(namespace, tag)
        found = current.find(qtag)
        if found is None:
            found = ET.SubElement(current, qtag)
        current = found
    return current

find_or_create.__module__ = 'pptx2html.server.ooxml_pptx_writer'
