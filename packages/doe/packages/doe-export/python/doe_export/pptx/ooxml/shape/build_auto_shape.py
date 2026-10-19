# Origin: pptx2html/server/ooxml_pptx_writer.py::build_auto_shape
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, P
from doe_export.pptx.ooxml.text.build_text_body import build_text_body
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.text.is_text_box import is_text_box
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.text.shape_text_container_metrics import shape_text_container_metrics
from doe_export.pptx.ooxml.shape.write_fill import write_fill
from doe_export.pptx.ooxml.geometry.write_geometry import write_geometry
from doe_export.pptx.ooxml.shape.write_line import write_line
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow

def build_auto_shape(ctx: SlideContext, shape: dict[str, Any]) -> ET.Element:
    shape_id = int(shape.get("shape_id") or 1)
    elem = ET.Element(qn(P, "sp"))
    nv = ET.SubElement(elem, qn(P, "nvSpPr"))
    ET.SubElement(nv, qn(P, "cNvPr"), {"id": str(shape_id), "name": shape.get("name") or f"Shape {shape_id}"})
    c_nv_sp = ET.SubElement(nv, qn(P, "cNvSpPr"))
    if is_text_box(shape):
        c_nv_sp.set("txBox", "1")
    ET.SubElement(nv, qn(P, "nvPr"))

    sp_pr = ET.SubElement(elem, qn(P, "spPr"))
    sp_pr.append(build_xfrm(shape, qn(A, "xfrm")))
    write_geometry(sp_pr, shape)
    write_fill(sp_pr, shape.get("fill"), ctx, effects=shape.get("effects"))
    write_line(sp_pr, shape.get("border"))
    write_shadow(sp_pr, shape.get("shadow"))
    if shape.get("text"):
        elem.append(
            build_text_body(
                shape.get("text"),
                container_metrics=shape_text_container_metrics(shape),
            )
        )
    return elem

build_auto_shape.__module__ = 'pptx2html.server.ooxml_pptx_writer'
