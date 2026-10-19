# Origin: pptx2html/server/ooxml_pptx_writer.py::is_shape_element
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.xml.qn import qn

def is_shape_element(elem: ET.Element) -> bool:
    return elem.tag in {
        qn(P, "sp"),
        qn(P, "pic"),
        qn(P, "cxnSp"),
        qn(P, "graphicFrame"),
        qn(P, "grpSp"),
    }

is_shape_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
