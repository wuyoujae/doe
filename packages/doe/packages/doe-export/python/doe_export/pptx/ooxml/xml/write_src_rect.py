# Origin: pptx2html/server/ooxml_pptx_writer.py::write_src_rect
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.percent_attr import percent_attr
from doe_export.pptx.ooxml.xml.qn import qn

def write_src_rect(blip_fill: ET.Element, image: dict[str, Any]) -> None:
    attrs: dict[str, str] = {}
    for key, attr in (("crop_left", "l"), ("crop_right", "r"), ("crop_top", "t"), ("crop_bottom", "b")):
        if image.get(key) is not None:
            attrs[attr] = percent_attr(image.get(key))
    if attrs:
        ET.SubElement(blip_fill, qn(A, "srcRect"), attrs)

write_src_rect.__module__ = 'pptx2html.server.ooxml_pptx_writer'
