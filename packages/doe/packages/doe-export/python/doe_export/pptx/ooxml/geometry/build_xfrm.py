# Origin: pptx2html/server/ooxml_pptx_writer.py::build_xfrm
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn

def build_xfrm(shape: dict[str, Any], tag: str) -> ET.Element:
    bounds = shape.get("bounds") or {}
    attrs: dict[str, str] = {}
    if shape.get("rotation"):
        attrs["rot"] = str(int(float(shape.get("rotation") or 0) * 60000))
    if shape.get("flip_horizontal"):
        attrs["flipH"] = "1"
    if shape.get("flip_vertical"):
        attrs["flipV"] = "1"
    xfrm = ET.Element(tag, attrs)
    ET.SubElement(xfrm, qn(A, "off"), {"x": str(pt_to_emu(bounds.get("left") or 0)), "y": str(pt_to_emu(bounds.get("top") or 0))})
    ET.SubElement(
        xfrm,
        qn(A, "ext"),
        {"cx": str(max(0, pt_to_emu(bounds.get("width") or 0))), "cy": str(max(0, pt_to_emu(bounds.get("height") or 0)))},
    )
    return xfrm

build_xfrm.__module__ = 'pptx2html.server.ooxml_pptx_writer'
