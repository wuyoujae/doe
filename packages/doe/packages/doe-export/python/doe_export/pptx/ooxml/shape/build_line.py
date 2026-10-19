# Origin: pptx2html/server/ooxml_pptx_writer.py::build_line
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn

def build_line(border: dict[str, Any], *, tag: str | None = None) -> ET.Element:
    attrs: dict[str, str] = {}
    if border.get("width") is not None:
        attrs["w"] = str(pt_to_emu(border.get("width")))
    if border.get("cap"):
        attrs["cap"] = str(border.get("cap"))
    if border.get("compound"):
        attrs["cmpd"] = str(border.get("compound"))
    if border.get("alignment"):
        attrs["algn"] = str(border.get("alignment"))
    ln = ET.Element(tag or qn(A, "ln"), attrs)
    if border.get("no_fill") or not border.get("width"):
        ET.SubElement(ln, qn(A, "noFill"))
    elif border.get("color"):
        solid = ET.SubElement(ln, qn(A, "solidFill"))
        append_srgb_color(solid, border.get("color"), border.get("alpha"))
    else:
        ET.SubElement(ln, qn(A, "solidFill"))
    if border.get("dash") and border.get("dash") != "solid":
        ET.SubElement(ln, qn(A, "prstDash"), {"val": str(border.get("dash"))})
    if border.get("join") == "round":
        ET.SubElement(ln, qn(A, "round"))
    elif border.get("join") == "bevel":
        ET.SubElement(ln, qn(A, "bevel"))
    elif border.get("join"):
        ET.SubElement(ln, qn(A, "miter"))
    for prefix, tag_name in (("head", "headEnd"), ("tail", "tailEnd")):
        if border.get(f"{prefix}_end_type"):
            attrs = {"type": str(border.get(f"{prefix}_end_type"))}
            if border.get(f"{prefix}_end_width"):
                attrs["w"] = str(border.get(f"{prefix}_end_width"))
            if border.get(f"{prefix}_end_length"):
                attrs["len"] = str(border.get(f"{prefix}_end_length"))
            ET.SubElement(ln, qn(A, tag_name), attrs)
    return ln

build_line.__module__ = 'pptx2html.server.ooxml_pptx_writer'
