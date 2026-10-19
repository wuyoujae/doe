# Origin: pptx2html/server/pptx_writer.py::_apply_line_xml
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, qn
from doe_export.pptx.writer.xml._alpha_to_ooxml import _alpha_to_ooxml
from doe_export.pptx.writer.xml._first_xml_descendant import _first_xml_descendant
from doe_export.pptx.writer.xml._remove_children import _remove_children
from doe_export.pptx.writer.shape._shape_sp_pr import _shape_sp_pr

def _apply_line_xml(pptx_shape, border: dict[str, Any]) -> None:
    ln = _first_xml_descendant(_shape_sp_pr(pptx_shape), "a:ln")
    if ln is None:
        return
    if border.get("cap"):
        ln.set("cap", str(border.get("cap")))
    if border.get("compound"):
        ln.set("cmpd", str(border.get("compound")))
    if border.get("alignment"):
        ln.set("algn", str(border.get("alignment")))

    solid = ln.find(qn("a:solidFill"))
    srgb = solid.find(qn("a:srgbClr")) if solid is not None else None
    alpha_value = _alpha_to_ooxml(border.get("alpha"))
    if srgb is not None and alpha_value is not None and alpha_value < 100000:
        _remove_children(srgb, ("a:alpha",))
        alpha_node = OxmlElement("a:alpha")
        alpha_node.set("val", str(alpha_value))
        srgb.append(alpha_node)

    _remove_children(ln, ("a:prstDash", "a:custDash", "a:round", "a:bevel", "a:miter", "a:headEnd", "a:tailEnd"))
    if border.get("dash") and border.get("dash") != "solid":
        dash = OxmlElement("a:prstDash")
        dash.set("val", str(border.get("dash")))
        ln.append(dash)
    join = border.get("join")
    if join == "round":
        ln.append(OxmlElement("a:round"))
    elif join == "bevel":
        ln.append(OxmlElement("a:bevel"))
    elif join:
        ln.append(OxmlElement("a:miter"))
    for prefix, tag_name in (("head", "a:headEnd"), ("tail", "a:tailEnd")):
        end_type = border.get(f"{prefix}_end_type")
        if not end_type:
            continue
        end = OxmlElement(tag_name)
        end.set("type", str(end_type))
        if border.get(f"{prefix}_end_width"):
            end.set("w", str(border.get(f"{prefix}_end_width")))
        if border.get(f"{prefix}_end_length"):
            end.set("len", str(border.get(f"{prefix}_end_length")))
        ln.append(end)

_apply_line_xml.__module__ = 'pptx2html.server.pptx_writer'
