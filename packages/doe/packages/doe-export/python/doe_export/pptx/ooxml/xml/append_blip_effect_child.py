# Origin: pptx2html/server/ooxml_pptx_writer.py::append_blip_effect_child
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.xml.qn import qn

def append_blip_effect_child(blip: ET.Element, child: ET.Element) -> None:
    for index, existing in enumerate(list(blip)):
        if existing.tag == qn(A, "extLst"):
            blip.insert(index, child)
            return
    blip.append(child)

append_blip_effect_child.__module__ = 'pptx2html.server.ooxml_pptx_writer'
