# Origin: pptx2html/server/ooxml_pptx_writer.py::build_paragraph
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, XML
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.shape.build_line_spacing import build_line_spacing
from doe_export.pptx.ooxml.text.build_run_properties import build_run_properties
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.text.text_needs_xml_space import text_needs_xml_space

def build_paragraph(paragraph: dict[str, Any]) -> ET.Element:
    p_elem = ET.Element(qn(A, "p"))
    p_pr_attrs: dict[str, str] = {}
    if paragraph.get("alignment"):
        p_pr_attrs["algn"] = str(paragraph.get("alignment"))
    if paragraph.get("level") is not None:
        p_pr_attrs["lvl"] = str(int(paragraph.get("level") or 0))
    if paragraph.get("margin_left") is not None:
        p_pr_attrs["marL"] = str(pt_to_emu(paragraph.get("margin_left")))
    if paragraph.get("indent") is not None:
        p_pr_attrs["indent"] = str(pt_to_emu(paragraph.get("indent")))
    if paragraph.get("default_tab_size") is not None:
        p_pr_attrs["defTabSz"] = str(pt_to_emu(paragraph.get("default_tab_size")))
    if paragraph.get("rtl") is not None:
        p_pr_attrs["rtl"] = bool_value(paragraph.get("rtl"))
    if paragraph.get("ea_line_break") is not None:
        p_pr_attrs["eaLnBrk"] = bool_value(paragraph.get("ea_line_break"))
    if paragraph.get("latin_line_break") is not None:
        p_pr_attrs["latinLnBrk"] = bool_value(paragraph.get("latin_line_break"))
    if paragraph.get("hanging_punctuation") is not None:
        p_pr_attrs["hangingPunct"] = bool_value(paragraph.get("hanging_punctuation"))
    p_pr: ET.Element | None = None
    if p_pr_attrs:
        p_pr = ET.Element(qn(A, "pPr"), p_pr_attrs)
        p_elem.append(p_pr)

    line_spacing = build_line_spacing(paragraph)
    if line_spacing is not None:
        if p_pr is None:
            p_pr = ET.Element(qn(A, "pPr"))
            p_elem.append(p_pr)
        p_pr.append(line_spacing)

    runs = paragraph.get("runs") or [{"text": ""}]
    for run in runs:
        if run.get("kind") == "break":
            p_elem.append(ET.Element(qn(A, "br")))
            continue
        r_elem = ET.SubElement(p_elem, qn(A, "r"))
        r_elem.append(build_run_properties(run.get("font") or {}))
        text = str(run.get("text") or "")
        t_elem = ET.SubElement(r_elem, qn(A, "t"))
        if text_needs_xml_space(text):
            t_elem.set(qn(XML, "space"), "preserve")
        t_elem.text = text
    if paragraph.get("end_para_font"):
        p_elem.append(build_run_properties(paragraph.get("end_para_font") or {}, tag="endParaRPr"))
    return p_elem

build_paragraph.__module__ = 'pptx2html.server.ooxml_pptx_writer'
