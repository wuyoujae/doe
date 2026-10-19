# Origin: pptx2html/server/ooxml_pptx_writer.py::build_body_pr
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.safe_float import safe_float
from doe_export.pptx.ooxml.text.text_anchor import text_anchor

def build_body_pr(text_frame: dict[str, Any]) -> ET.Element:
    attrs: dict[str, str] = {}
    margins = text_frame.get("margins") or {}
    for key, attr in (("left", "lIns"), ("right", "rIns"), ("bottom", "bIns")):
        if margins.get(key) is not None:
            attrs[attr] = str(pt_to_emu(margins.get(key)))
    baseline_top_offset = safe_float(text_frame.get("baseline_top_offset"), 0.0)
    if margins.get("top") is not None or baseline_top_offset:
        attrs["tIns"] = str(
            pt_to_emu(safe_float(margins.get("top"), 0.0) + baseline_top_offset)
        )
    if text_frame.get("word_wrap") is False:
        attrs["wrap"] = "none"
    elif text_frame.get("word_wrap") is True:
        attrs["wrap"] = "square"
    if text_frame.get("horizontal_overflow") in {"overflow", "clip"}:
        attrs["horzOverflow"] = str(text_frame.get("horizontal_overflow"))
    if text_frame.get("vertical_overflow") in {"overflow", "ellipsis", "clip"}:
        attrs["vertOverflow"] = str(text_frame.get("vertical_overflow"))
    if text_frame.get("vertical_align"):
        attrs["anchor"] = text_anchor(text_frame.get("vertical_align"))
    if text_frame.get("vertical_text"):
        attrs["vert"] = str(text_frame.get("vertical_text"))
    try:
        column_count = int(text_frame.get("column_count") or 0)
    except (TypeError, ValueError):
        column_count = 0
    if column_count > 1:
        attrs["numCol"] = str(max(1, min(16, column_count)))
        if text_frame.get("column_spacing") is not None:
            attrs["spcCol"] = str(pt_to_emu(text_frame.get("column_spacing")))
        if text_frame.get("rtl_columns") is not None:
            attrs["rtlCol"] = bool_value(text_frame.get("rtl_columns"))
    if text_frame.get("rotation"):
        attrs["rot"] = str(int(float(text_frame.get("rotation")) * 60000))
    body_pr = ET.Element(qn(A, "bodyPr"), attrs)
    autofit_mode = text_frame.get("autofit_mode")
    if autofit_mode == "none":
        ET.SubElement(body_pr, qn(A, "noAutofit"))
    elif autofit_mode == "normal":
        norm_attrs: dict[str, str] = {}
        if text_frame.get("autofit_font_scale") is not None:
            norm_attrs["fontScale"] = percent_attr(text_frame.get("autofit_font_scale"))
        if text_frame.get("autofit_line_spacing_reduction") is not None:
            norm_attrs["lnSpcReduction"] = percent_attr(text_frame.get("autofit_line_spacing_reduction"))
        ET.SubElement(body_pr, qn(A, "normAutofit"), norm_attrs)
    elif autofit_mode == "shape":
        ET.SubElement(body_pr, qn(A, "spAutoFit"))
    return body_pr

build_body_pr.__module__ = 'pptx2html.server.ooxml_pptx_writer'
