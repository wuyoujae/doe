# Origin: pptx2html/server/ooxml_pptx_writer.py::write_slide_background
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET, P
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.remove_children import remove_children
from doe_export.pptx.ooxml.shape.write_fill import write_fill

def write_slide_background(
    ctx: SlideContext,
    root: ET.Element,
    background: dict[str, Any] | None,
    *,
    original_background: dict[str, Any] | None = None,
) -> None:
    c_sld = root.find(qn(P, "cSld"))
    if c_sld is None:
        return
    source_bg_pr = c_sld.find(f"{{{P}}}bg/{{{P}}}bgPr")
    remove_children(c_sld, {qn(P, "bg")})
    fill = (background or {}).get("fill") or {}
    if not fill or fill.get("type") in {None, "none"}:
        return

    bg = ET.Element(qn(P, "bg"))
    bg_pr = ET.SubElement(bg, qn(P, "bgPr"), {"shadeToTitle": "0"})
    write_fill(
        bg_pr,
        fill,
        ctx,
        source_container=source_bg_pr,
        original_fill=((original_background or {}).get("fill")),
    )
    children = list(c_sld)
    for index, child in enumerate(children):
        if child.tag == qn(P, "spTree"):
            c_sld.insert(index, bg)
            break
    else:
        c_sld.insert(0, bg)

write_slide_background.__module__ = 'pptx2html.server.ooxml_pptx_writer'
