# Origin: pptx2html/server/ooxml_pptx_writer.py::write_blip_image_effects
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET
from doe_export.pptx.ooxml.xml.append_blip_effect_child import append_blip_effect_child
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children

def write_blip_image_effects(blip: ET.Element, effects: list[dict[str, Any]] | None) -> None:
    remove_children(blip, {qn(A, "grayscl")})
    if any(str(effect.get("type") or "") == "grayscale" for effect in (effects or [])):
        append_blip_effect_child(blip, ET.Element(qn(A, "grayscl")))

write_blip_image_effects.__module__ = 'pptx2html.server.ooxml_pptx_writer'
