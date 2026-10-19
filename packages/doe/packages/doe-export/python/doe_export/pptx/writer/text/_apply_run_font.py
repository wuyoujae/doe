# Origin: pptx2html/server/pptx_writer.py::_apply_run_font
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, Pt, qn
from doe_export.pptx.writer.text._apply_run_font_alpha import _apply_run_font_alpha
from doe_export.pptx.writer.text._apply_run_font_families import _apply_run_font_families
from doe_export.pptx.writer.text._apply_run_font_spacing import _apply_run_font_spacing
from doe_export.pptx.writer.text._apply_run_underline_details import _apply_run_underline_details
from doe_export.pptx.writer.xml._bool_to_xml import _bool_to_xml
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._hex_color import _hex_color
from doe_export.pptx.writer.shape._write_shadow_xml import _write_shadow_xml

def _apply_run_font(run, font: dict[str, Any]) -> None:
    run.font.name = font.get("latin_family") or font.get("family") or font.get("ea_family") or "Arial"
    _apply_run_font_families(run, font)
    _apply_run_font_spacing(run, font)
    if font.get("size_pt") is not None:
        run.font.size = Pt(float(font.get("size_pt") or 12))
    run.font.bold = bool(font.get("bold"))
    run.font.italic = bool(font.get("italic"))
    color = _hex_color(font.get("color"))
    if color:
        run.font.color.rgb = color
        _apply_run_font_alpha(run, font.get("alpha"))
    if font.get("underline") and not font.get("text_decoration_overlay"):
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("u", str(font.get("underline")))
        _apply_run_underline_details(r_pr, font)
    hyperlink_url = font.get("hyperlink_url")
    if hyperlink_url:
        run.hyperlink.address = str(hyperlink_url)
    if font.get("strike") and not font.get("text_decoration_overlay"):
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("strike", str(font.get("strike") or "sng"))
    if font.get("baseline") is not None:
        try:
            baseline = int(round(float(font.get("baseline") or 0) * 100000))
        except (TypeError, ValueError):
            baseline = 0
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("baseline", str(baseline))
    if font.get("kerning_pt") is not None:
        try:
            kerning = int(round(float(font.get("kerning_pt") or 0) * 100))
        except (TypeError, ValueError):
            kerning = 0
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("kern", str(kerning))
    if font.get("capitalization") in {"all", "small"}:
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("cap", str(font.get("capitalization")))
    if font.get("rtl") is not None:
        r_pr = run._r.get_or_add_rPr()
        r_pr.set("rtl", _bool_to_xml(font.get("rtl")))
    if font.get("shadow"):
        r_pr = run._r.get_or_add_rPr()
        _write_shadow_xml(r_pr, font.get("shadow"))
    highlight = _clean_hex(font.get("highlight"))
    if highlight:
        r_pr = run._r.get_or_add_rPr()
        existing = r_pr.find(qn("a:highlight"))
        if existing is not None:
            r_pr.remove(existing)
        highlight_elem = OxmlElement("a:highlight")
        srgb = OxmlElement("a:srgbClr")
        srgb.set("val", highlight)
        highlight_elem.append(srgb)
        r_pr.append(highlight_elem)

_apply_run_font.__module__ = 'pptx2html.server.pptx_writer'
