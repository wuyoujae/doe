# Origin: pptx2html/server/pptx_writer.py::_write_shadow_xml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, math
from doe_export.pptx.writer.xml._append_srgb import _append_srgb
from doe_export.pptx.writer.xml._clean_hex import _clean_hex
from doe_export.pptx.writer.xml._insert_effect_or_append import _insert_effect_or_append
from doe_export.pptx.writer.xml._pt_to_emu import _pt_to_emu
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.xml._safe_float import _safe_float
from doe_export.pptx.writer.shape._shadow_direction_to_ooxml import _shadow_direction_to_ooxml

def _write_shadow_xml(sp_pr, shadow: dict[str, Any] | None) -> None:
    _remove_children(sp_pr, ("a:effectLst",))
    if not shadow:
        return
    if str(shadow.get("type") or "").lower() == "softedge":
        blur = _safe_float(shadow.get("blur_pt"), 0.0)
        if blur <= 0:
            return
        effect_lst = OxmlElement("a:effectLst")
        soft_edge = OxmlElement("a:softEdge")
        soft_edge.set("rad", str(_pt_to_emu(blur)))
        effect_lst.append(soft_edge)
        sp_pr.append(effect_lst)
        return
    color = _clean_hex(shadow.get("color")) or "000000"
    effect_lst = OxmlElement("a:effectLst")
    shadow_tag = "a:innerShdw" if str(shadow.get("type") or "").lower() == "inner" else "a:outerShdw"
    shadow_node = OxmlElement(shadow_tag)
    blur = _safe_float(shadow.get("blur_pt"), 0.0)
    offset_x = _safe_float(shadow.get("offset_x"), 0.0)
    offset_y = _safe_float(shadow.get("offset_y"), 0.0)
    dist = math.hypot(offset_x, offset_y)
    if blur > 0:
        shadow_node.set("blurRad", str(_pt_to_emu(blur)))
    if dist > 0.001:
        shadow_node.set("dist", str(_pt_to_emu(dist)))
        shadow_node.set("dir", str(_shadow_direction_to_ooxml(offset_x, offset_y)))
    else:
        shadow_node.set("dist", "0")
        shadow_node.set("dir", "0")
    shadow_node.set("rotWithShape", "0")
    _append_srgb(shadow_node, color, shadow.get("alpha"))
    effect_lst.append(shadow_node)
    _insert_effect_or_append(sp_pr, effect_lst)

_write_shadow_xml.__module__ = 'pptx2html.server.pptx_writer'
