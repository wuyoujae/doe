# Origin: pptx2html/server/ooxml_pptx_writer.py::append_effect_child
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.xml.qn import qn

def append_effect_child(parent: ET.Element, child: ET.Element) -> None:
    tail_tags = {qn(A, "scene3d"), qn(A, "sp3d"), qn(A, "extLst")}
    for index, existing in enumerate(list(parent)):
        if existing.tag in tail_tags:
            parent.insert(index, child)
            return
    parent.append(child)

append_effect_child.__module__ = 'pptx2html.server.ooxml_pptx_writer'
