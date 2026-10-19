# Origin: pptx2html/server/pptx_writer.py::_apply_paragraph_properties
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Pt
from doe_export.pptx.writer.text._apply_paragraph_bullet import _apply_paragraph_bullet
from doe_export.pptx.writer.xml._bool_to_xml import _bool_to_xml
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu

def _apply_paragraph_properties(pptx_para, paragraph: dict[str, Any]) -> None:
    if paragraph.get("level") is not None:
        try:
            pptx_para.level = max(0, min(8, int(paragraph.get("level") or 0)))
        except (TypeError, ValueError):
            pass
    if paragraph.get("spacing_before") is not None:
        pptx_para.space_before = Pt(float(paragraph.get("spacing_before") or 0))
    if paragraph.get("spacing_after") is not None:
        pptx_para.space_after = Pt(float(paragraph.get("spacing_after") or 0))
    line_spacing_type = paragraph.get("line_spacing_type")
    if line_spacing_type == "points" and paragraph.get("line_spacing_pt") is not None:
        pptx_para.line_spacing = Pt(float(paragraph.get("line_spacing_pt") or 0))
    elif line_spacing_type == "percent" and paragraph.get("line_spacing_multiple") is not None:
        pptx_para.line_spacing = float(paragraph.get("line_spacing_multiple") or 1)
    elif paragraph.get("line_spacing_pt") is not None:
        pptx_para.line_spacing = Pt(float(paragraph.get("line_spacing_pt") or 0))
    elif paragraph.get("line_spacing_multiple") is not None:
        pptx_para.line_spacing = float(paragraph.get("line_spacing_multiple") or 1)

    p_pr = pptx_para._p.get_or_add_pPr()
    if paragraph.get("margin_left") is not None:
        p_pr.set("marL", str(_pt_to_emu(paragraph.get("margin_left"))))
    if paragraph.get("indent") is not None:
        p_pr.set("indent", str(_pt_to_emu(paragraph.get("indent"))))
    if paragraph.get("default_tab_size") is not None:
        p_pr.set("defTabSz", str(_pt_to_emu(paragraph.get("default_tab_size"))))
    if paragraph.get("rtl") is not None:
        p_pr.set("rtl", _bool_to_xml(paragraph.get("rtl")))
    if paragraph.get("ea_line_break") is not None:
        p_pr.set("eaLnBrk", _bool_to_xml(paragraph.get("ea_line_break")))
    if paragraph.get("latin_line_break") is not None:
        p_pr.set("latinLnBrk", _bool_to_xml(paragraph.get("latin_line_break")))
    if paragraph.get("hanging_punctuation") is not None:
        p_pr.set("hangingPunct", _bool_to_xml(paragraph.get("hanging_punctuation")))
    _apply_paragraph_bullet(p_pr, paragraph.get("bullet"))

_apply_paragraph_properties.__module__ = 'pptx2html.server.pptx_writer'
