# Origin: pptx2html/server/pptx_writer.py::_slide_target
from __future__ import annotations
from doe_export.pptx.writer.shared import OxmlElement

def _slide_target():
    tgt_el = OxmlElement("p:tgtEl")
    tgt_el.append(OxmlElement("p:sldTgt"))
    return tgt_el

_slide_target.__module__ = 'pptx2html.server.pptx_writer'
