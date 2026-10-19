# Origin: pptx2html/server/ooxml_pptx_writer.py::append_srgb_color
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.clean_hex import clean_hex
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def append_srgb_color(parent: ET.Element, color: Any, alpha: Any = None) -> ET.Element:
    elem = ET.SubElement(parent, qn(A, "srgbClr"), {"val": clean_hex(color)})
    if alpha is not None and safe_float(alpha, 1.0) < 1:
        ET.SubElement(elem, qn(A, "alpha"), {"val": percent_attr(alpha)})
    return elem

append_srgb_color.__module__ = 'pptx2html.server.ooxml_pptx_writer'
