# Origin: pptx2html/server/pptx_writer.py::_append_src_rect
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement
from doe_export.pptx.writer.xml._percent_to_ooxml import _percent_to_ooxml

def _append_src_rect(blip_fill, image: dict[str, Any]) -> None:
    attrs: dict[str, str] = {}
    for key, attr in (("crop_left", "l"), ("crop_right", "r"), ("crop_top", "t"), ("crop_bottom", "b")):
        if image.get(key) is not None:
            attrs[attr] = str(_percent_to_ooxml(image.get(key)))
    if attrs:
        src_rect = OxmlElement("a:srcRect")
        for attr, value in attrs.items():
            src_rect.set(attr, value)
        blip_fill.append(src_rect)

_append_src_rect.__module__ = 'pptx2html.server.pptx_writer'
