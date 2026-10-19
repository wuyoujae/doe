# Origin: pptx2html/server/ooxml_pptx_writer.py::write_text_underline_details
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.shape.underline_to_dash import underline_to_dash

def write_text_underline_details(r_pr: ET.Element, font: dict[str, Any]) -> None:
    if font.get("text_decoration_overlay") or not font.get("underline") or str(font.get("underline")) == "none":
        return
    color = font.get("underline_color")
    alpha = font.get("underline_alpha")
    width = font.get("underline_width_pt")
    underline = str(font.get("underline") or "")
    dash = underline_to_dash(underline)
    if width is not None or dash:
        attrs: dict[str, str] = {}
        if width is not None:
            attrs["w"] = str(max(1, pt_to_emu(width)))
        u_ln = ET.SubElement(r_pr, qn(A, "uLn"), attrs)
        solid = ET.SubElement(u_ln, qn(A, "solidFill"))
        append_srgb_color(solid, color or font.get("color") or "000000", alpha)
        if dash:
            ET.SubElement(u_ln, qn(A, "prstDash"), {"val": dash})
        return
    if color:
        u_fill = ET.SubElement(r_pr, qn(A, "uFill"))
        solid = ET.SubElement(u_fill, qn(A, "solidFill"))
        append_srgb_color(solid, color, alpha)

write_text_underline_details.__module__ = 'pptx2html.server.ooxml_pptx_writer'
