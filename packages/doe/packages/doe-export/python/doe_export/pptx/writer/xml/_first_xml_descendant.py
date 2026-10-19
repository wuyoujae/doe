# Origin: pptx2html/server/pptx_writer.py::_first_xml_descendant
from __future__ import annotations
from doe_export.pptx.writer.shared import qn

def _first_xml_descendant(parent, name: str):
    tag = qn(name)
    for child in parent.iter():
        if child.tag == tag:
            return child
    return None

_first_xml_descendant.__module__ = 'pptx2html.server.pptx_writer'
