# Origin: pptx2html/server/ooxml_pptx_writer.py::build_run_properties
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.xml.clean_hex import clean_hex
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_float import safe_float
from doe_export.pptx.ooxml.shape.write_shadow import write_shadow
from doe_export.pptx.ooxml.text.write_text_underline_details import write_text_underline_details

def build_run_properties(font: dict[str, Any], *, tag: str = "rPr") -> ET.Element:
    attrs: dict[str, str] = {}
    if font.get("size_pt") is not None:
        attrs["sz"] = str(max(100, int(round(float(font.get("size_pt") or 1) * 100))))
    if font.get("bold") is not None:
        attrs["b"] = bool_value(font.get("bold"))
    if font.get("italic") is not None:
        attrs["i"] = bool_value(font.get("italic"))
    if font.get("underline") and not font.get("text_decoration_overlay"):
        attrs["u"] = str(font.get("underline"))
    if font.get("strike") and not font.get("text_decoration_overlay"):
        attrs["strike"] = str(font.get("strike"))
    if font.get("baseline") is not None:
        attrs["baseline"] = str(int(round(float(font.get("baseline") or 0) * 100000)))
    if font.get("char_spacing_pt") is not None:
        attrs["spc"] = str(int(round(safe_float(font.get("char_spacing_pt"), 0.0) * 100)))
    if font.get("kerning_pt") is not None:
        attrs["kern"] = str(int(round(safe_float(font.get("kerning_pt"), 0.0) * 100)))
    if font.get("capitalization") in {"all", "small"}:
        attrs["cap"] = str(font.get("capitalization"))
    if font.get("rtl") is not None:
        attrs["rtl"] = bool_value(font.get("rtl"))
    r_pr = ET.Element(qn(A, tag), attrs)
    if font.get("color"):
        solid = ET.SubElement(r_pr, qn(A, "solidFill"))
        ET.SubElement(solid, qn(A, "srgbClr"), {"val": clean_hex(font.get("color"))})
    if font.get("highlight"):
        highlight = ET.SubElement(r_pr, qn(A, "highlight"))
        ET.SubElement(highlight, qn(A, "srgbClr"), {"val": clean_hex(font.get("highlight"))})
    write_text_underline_details(r_pr, font)
    if font.get("shadow"):
        write_shadow(r_pr, font.get("shadow"))
    latin = font.get("latin_family") or font.get("family")
    ea = font.get("ea_family")
    cs = font.get("cs_family")
    sym = font.get("sym_family")
    if latin:
        ET.SubElement(r_pr, qn(A, "latin"), {"typeface": str(latin)})
    if ea:
        ET.SubElement(r_pr, qn(A, "ea"), {"typeface": str(ea)})
    if cs:
        ET.SubElement(r_pr, qn(A, "cs"), {"typeface": str(cs)})
    if sym:
        ET.SubElement(r_pr, qn(A, "sym"), {"typeface": str(sym)})
    return r_pr

build_run_properties.__module__ = 'pptx2html.server.ooxml_pptx_writer'
