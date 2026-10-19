# Origin: pptx2html/server/ooxml_pptx_writer.py::build_picture
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, P, R
from doe_export.pptx.ooxml.geometry.build_xfrm import build_xfrm
from doe_export.pptx.ooxml.assets.merged_image_effects import merged_image_effects
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.write_blip_alpha import write_blip_alpha
from doe_export.pptx.ooxml.shape.write_blip_fill_layout import write_blip_fill_layout
from doe_export.pptx.ooxml.assets.write_blip_image_effects import write_blip_image_effects
from doe_export.pptx.ooxml.shape.write_line import write_line
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow

def build_picture(ctx: SlideContext, shape: dict[str, Any]) -> ET.Element:
    shape_id = int(shape.get("shape_id") or 1)
    image = shape.get("image") or {}
    r_id = ctx.add_image_relationship(image)
    elem = ET.Element(qn(P, "pic"))
    nv = ET.SubElement(elem, qn(P, "nvPicPr"))
    ET.SubElement(nv, qn(P, "cNvPr"), {"id": str(shape_id), "name": shape.get("name") or f"Picture {shape_id}"})
    c_nv_pic = ET.SubElement(nv, qn(P, "cNvPicPr"))
    ET.SubElement(c_nv_pic, qn(A, "picLocks"), {"noChangeAspect": "1"})
    ET.SubElement(nv, qn(P, "nvPr"))

    blip_fill = ET.SubElement(elem, qn(P, "blipFill"))
    blip = ET.SubElement(blip_fill, qn(A, "blip"), {qn(R, "embed"): r_id})
    write_blip_alpha(blip, image.get("alpha"))
    write_blip_image_effects(
        blip,
        merged_image_effects(image.get("effects"), shape.get("effects")),
    )
    write_blip_fill_layout(blip_fill, image)

    sp_pr = ET.SubElement(elem, qn(P, "spPr"))
    sp_pr.append(build_xfrm(shape, qn(A, "xfrm")))
    ET.SubElement(ET.SubElement(sp_pr, qn(A, "prstGeom"), {"prst": "rect"}), qn(A, "avLst"))
    write_line(sp_pr, shape.get("border"))
    write_shadow(sp_pr, shape.get("shadow"))
    return elem

build_picture.__module__ = 'pptx2html.server.ooxml_pptx_writer'
