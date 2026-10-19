# Origin: pptx2html/server/ooxml_pptx_writer.py::write_pattern_fill
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.shape.insert_fill_child import insert_fill_child
from doe_export.pptx.ooxml.xml.qn import qn

def write_pattern_fill(container: ET.Element, fill: dict[str, Any]) -> None:
    attrs: dict[str, str] = {}
    if fill.get("pattern_preset"):
        attrs["prst"] = str(fill.get("pattern_preset"))
    pattern = ET.Element(qn(A, "pattFill"), attrs)
    if fill.get("pattern_fg_color"):
        append_srgb_color(ET.SubElement(pattern, qn(A, "fgClr")), fill.get("pattern_fg_color"))
    if fill.get("pattern_bg_color"):
        append_srgb_color(ET.SubElement(pattern, qn(A, "bgClr")), fill.get("pattern_bg_color"))
    insert_fill_child(container, pattern)

write_pattern_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
