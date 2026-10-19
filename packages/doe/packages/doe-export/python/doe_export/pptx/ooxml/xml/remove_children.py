# Origin: pptx2html/server/ooxml_pptx_writer.py::remove_children
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET

def remove_children(parent: ET.Element, tags: set[str]) -> None:
    for child in list(parent):
        if child.tag in tags:
            parent.remove(child)

remove_children.__module__ = 'pptx2html.server.ooxml_pptx_writer'
