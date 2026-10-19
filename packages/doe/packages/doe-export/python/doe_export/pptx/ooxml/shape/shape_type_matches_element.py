# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_type_matches_element
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.xml.qn import qn

def shape_type_matches_element(shape: dict[str, Any], elem: ET.Element) -> bool:
    shape_type = shape.get("type")
    if elem.tag == qn(P, "pic"):
        return shape_type == "picture"
    if elem.tag == qn(P, "cxnSp"):
        return shape_type == "connector" or shape.get("geometry") == "line"
    if elem.tag == qn(P, "graphicFrame"):
        return shape_type == "graphic_frame"
    if elem.tag == qn(P, "grpSp"):
        return shape_type == "group_shape"
    if elem.tag == qn(P, "sp"):
        return shape_type == "auto_shape"
    return False

shape_type_matches_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
