# Origin: pptx2html/server/ooxml_pptx_writer.py::write_shadow
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, math
from doe_export.pptx.ooxml.xml.append_effect_child import append_effect_child
from doe_export.pptx.ooxml.xml.append_srgb_color import append_srgb_color
from doe_export.pptx.ooxml.xml.pt_to_emu import pt_to_emu
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.xml.safe_float import safe_float
from doe_export.pptx.ooxml.shape.shadow_direction_attr import shadow_direction_attr

def write_shadow(container: ET.Element, shadow: dict[str, Any] | None) -> None:
    remove_children(container, {qn(A, "effectLst")})
    if not shadow:
        return
    if str(shadow.get("type") or "").lower() == "softedge":
        blur = safe_float(shadow.get("blur_pt"), 0.0)
        if blur <= 0:
            return
        effect_lst = ET.Element(qn(A, "effectLst"))
        ET.SubElement(effect_lst, qn(A, "softEdge"), {"rad": str(pt_to_emu(blur))})
        append_effect_child(container, effect_lst)
        return
    attrs: dict[str, str] = {}
    blur = safe_float(shadow.get("blur_pt"), 0.0)
    offset_x = safe_float(shadow.get("offset_x"), 0.0)
    offset_y = safe_float(shadow.get("offset_y"), 0.0)
    dist = math.hypot(offset_x, offset_y)
    if blur > 0:
        attrs["blurRad"] = str(pt_to_emu(blur))
    if dist > 0.001:
        attrs["dist"] = str(pt_to_emu(dist))
        attrs["dir"] = str(shadow_direction_attr(offset_x, offset_y))
    else:
        attrs["dist"] = "0"
        attrs["dir"] = "0"
    attrs["rotWithShape"] = "0"

    effect_lst = ET.Element(qn(A, "effectLst"))
    tag = "innerShdw" if str(shadow.get("type") or "").lower() == "inner" else "outerShdw"
    shadow_node = ET.SubElement(effect_lst, qn(A, tag), attrs)
    append_srgb_color(shadow_node, shadow.get("color") or "000000", shadow.get("alpha"))
    append_effect_child(container, effect_lst)

write_shadow.__module__ = 'pptx2html.server.ooxml_pptx_writer'
