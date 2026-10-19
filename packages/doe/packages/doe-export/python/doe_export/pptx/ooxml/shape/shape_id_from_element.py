# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_id_from_element
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import P
from doe_export.pptx.ooxml.xml.qn import qn

def shape_id_from_element(elem: ET.Element) -> int | None:
    paths = {
        qn(P, "sp"): f"{{{P}}}nvSpPr/{{{P}}}cNvPr",
        qn(P, "pic"): f"{{{P}}}nvPicPr/{{{P}}}cNvPr",
        qn(P, "cxnSp"): f"{{{P}}}nvCxnSpPr/{{{P}}}cNvPr",
        qn(P, "graphicFrame"): f"{{{P}}}nvGraphicFramePr/{{{P}}}cNvPr",
        qn(P, "grpSp"): f"{{{P}}}nvGrpSpPr/{{{P}}}cNvPr",
    }
    c_nv_pr = elem.find(paths.get(elem.tag, ""))
    if c_nv_pr is None:
        c_nv_pr = elem.find(f".//{{{P}}}cNvPr")
    try:
        return int(c_nv_pr.get("id")) if c_nv_pr is not None and c_nv_pr.get("id") else None
    except ValueError:
        return None

shape_id_from_element.__module__ = 'pptx2html.server.ooxml_pptx_writer'
