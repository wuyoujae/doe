# Origin: pptx2html/server/pptx_writer.py::_apply_picture_slide_background
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import OxmlElement, has_image_payload, qn
from doe_export.pptx.writer.assets._add_image_part import _add_image_part
from doe_export.pptx.writer.shape._build_blip_fill import _build_blip_fill
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _apply_picture_slide_background(slide, fill: dict[str, Any]) -> bool:
    image = fill.get("image") or {}
    if not has_image_payload(image):
        return False
    rel_id = _add_image_part(slide, image)
    c_sld = slide._element.find(qn("p:cSld"))
    if c_sld is None:
        return False
    _remove_children(c_sld, ("p:bg",))
    bg = OxmlElement("p:bg")
    bg_pr = OxmlElement("p:bgPr")
    bg_pr.set("shadeToTitle", "0")
    bg_pr.append(_build_blip_fill(rel_id, image, fill_alpha=fill.get("alpha")))
    bg.append(bg_pr)
    for index, child in enumerate(list(c_sld)):
        if child.tag == qn("p:spTree"):
            c_sld.insert(index, bg)
            break
    else:
        c_sld.insert(0, bg)
    return True

_apply_picture_slide_background.__module__ = 'pptx2html.server.pptx_writer'
