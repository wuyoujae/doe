# Origin: pptx2html/server/ooxml_pptx_writer.py::build_connector
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, P
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.shape.write_line import write_line
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow

def build_connector(shape: dict[str, Any]) -> ET.Element:
    shape_id = int(shape.get("shape_id") or 1)
    elem = ET.Element(qn(P, "cxnSp"))
    nv = ET.SubElement(elem, qn(P, "nvCxnSpPr"))
    ET.SubElement(nv, qn(P, "cNvPr"), {"id": str(shape_id), "name": shape.get("name") or f"Connector {shape_id}"})
    ET.SubElement(nv, qn(P, "cNvCxnSpPr"))
    ET.SubElement(nv, qn(P, "nvPr"))

    sp_pr = ET.SubElement(elem, qn(P, "spPr"))
    sp_pr.append(build_xfrm(shape, qn(A, "xfrm")))
    ET.SubElement(ET.SubElement(sp_pr, qn(A, "prstGeom"), {"prst": "line"}), qn(A, "avLst"))
    write_line(sp_pr, shape.get("border"))
    write_shadow(sp_pr, shape.get("shadow"))
    return elem

build_connector.__module__ = 'pptx2html.server.ooxml_pptx_writer'
