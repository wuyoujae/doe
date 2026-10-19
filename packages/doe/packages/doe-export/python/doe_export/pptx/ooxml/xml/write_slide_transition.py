# Origin: pptx2html/server/ooxml_pptx_writer.py::write_slide_transition
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET, P
from doe_export.pptx.ooxml.xml.bool_value import bool_value
from doe_export.pptx.ooxml.xml.insert_slide_child_before import insert_slide_child_before
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.xml.safe_transition_type import safe_transition_type
from doe_export.pptx.ooxml.xml.transition_direction_attr import transition_direction_attr

def write_slide_transition(root: ET.Element, transition: dict[str, Any] | None) -> None:
    remove_children(root, {qn(P, "transition")})
    if not transition:
        return

    attrs: dict[str, str] = {}
    raw_attrs = transition.get("raw_attrs") or {}
    for key, value in raw_attrs.items():
        if value is not None:
            attrs[str(key)] = str(value)
    if transition.get("speed"):
        attrs["spd"] = str(transition.get("speed"))
    if transition.get("advance_on_click") is not None:
        attrs["advClick"] = bool_value(transition.get("advance_on_click"))
    if transition.get("advance_after_ms") is not None:
        attrs["advTm"] = str(int(round(float(transition.get("advance_after_ms") or 0))))

    elem = ET.Element(qn(P, "transition"), attrs)
    effect_type = safe_transition_type(transition.get("type"))
    effect_attrs: dict[str, str] = {}
    direction = transition.get("direction")
    if direction is not None:
        effect_attrs[transition_direction_attr(effect_type, direction)] = str(direction)
    ET.SubElement(elem, qn(P, effect_type), effect_attrs)
    insert_slide_child_before(root, elem, before_tags={qn(P, "timing"), qn(P, "extLst")})

write_slide_transition.__module__ = 'pptx2html.server.ooxml_pptx_writer'
