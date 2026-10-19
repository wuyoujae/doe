# Origin: pptx2html/server/pptx_writer.py::_apply_text_body_properties
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._bool_to_xml import _bool_to_xml
from doe_export.pptx.writer.xml._percent_to_ooxml import _percent_to_ooxml
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.text._text_anchor import _text_anchor

def _apply_text_body_properties(pptx_text_frame, text_frame: dict[str, Any]) -> None:
    body_pr = pptx_text_frame._txBody.bodyPr
    if text_frame.get("word_wrap") is False:
        body_pr.set("wrap", "none")
    elif text_frame.get("word_wrap") is True:
        body_pr.set("wrap", "square")

    horizontal_overflow = text_frame.get("horizontal_overflow")
    if horizontal_overflow in {"overflow", "clip"}:
        body_pr.set("horzOverflow", str(horizontal_overflow))
    else:
        body_pr.attrib.pop("horzOverflow", None)

    vertical_overflow = text_frame.get("vertical_overflow")
    if vertical_overflow in {"overflow", "ellipsis", "clip"}:
        body_pr.set("vertOverflow", str(vertical_overflow))
    else:
        body_pr.attrib.pop("vertOverflow", None)

    if text_frame.get("vertical_align"):
        body_pr.set("anchor", _text_anchor(text_frame.get("vertical_align")))

    vertical_text = text_frame.get("vertical_text")
    if vertical_text:
        body_pr.set("vert", str(vertical_text))
    else:
        body_pr.attrib.pop("vert", None)

    column_count = text_frame.get("column_count")
    try:
        column_count_int = int(column_count or 0)
    except (TypeError, ValueError):
        column_count_int = 0
    if column_count_int > 1:
        body_pr.set("numCol", str(max(1, min(16, column_count_int))))
        if text_frame.get("column_spacing") is not None:
            body_pr.set("spcCol", str(_pt_to_emu(text_frame.get("column_spacing"))))
        else:
            body_pr.attrib.pop("spcCol", None)
        if text_frame.get("rtl_columns") is not None:
            body_pr.set("rtlCol", _bool_to_xml(text_frame.get("rtl_columns")))
    else:
        body_pr.attrib.pop("numCol", None)
        body_pr.attrib.pop("spcCol", None)
        body_pr.attrib.pop("rtlCol", None)

    _remove_children(body_pr, ("a:noAutofit", "a:normAutofit", "a:spAutoFit"))
    autofit_mode = text_frame.get("autofit_mode")
    if autofit_mode == "none":
        body_pr.append(OxmlElement("a:noAutofit"))
    elif autofit_mode == "normal":
        norm = OxmlElement("a:normAutofit")
        if text_frame.get("autofit_font_scale") is not None:
            norm.set("fontScale", str(_percent_to_ooxml(text_frame.get("autofit_font_scale"))))
        if text_frame.get("autofit_line_spacing_reduction") is not None:
            norm.set("lnSpcReduction", str(_percent_to_ooxml(text_frame.get("autofit_line_spacing_reduction"))))
        body_pr.append(norm)
    elif autofit_mode == "shape":
        body_pr.append(OxmlElement("a:spAutoFit"))

_apply_text_body_properties.__module__ = 'pptx2html.server.pptx_writer'
