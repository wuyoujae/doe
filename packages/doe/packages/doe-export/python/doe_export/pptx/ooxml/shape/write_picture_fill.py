# Origin: pptx2html/server/ooxml_pptx_writer.py::write_picture_fill
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import A, ET, R, has_image_payload
from doe_export.pptx.ooxml.xml.combined_alpha import combined_alpha
from doe_export.pptx.ooxml.shape.insert_fill_child import insert_fill_child
from doe_export.pptx.ooxml.assets.merged_image_effects import merged_image_effects
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.geometry.rewrite_svg_blip_extensions import rewrite_svg_blip_extensions
from doe_export.pptx.ooxml.xml.write_blip_alpha import write_blip_alpha
from doe_export.pptx.ooxml.shape.write_blip_fill_layout import write_blip_fill_layout
from doe_export.pptx.ooxml.assets.write_blip_image_effects import write_blip_image_effects

def write_picture_fill(
    ctx: SlideContext,
    container: ET.Element,
    fill: dict[str, Any],
    *,
    effects: list[dict[str, Any]] | None = None,
) -> bool:
    image = fill.get("image") or {}
    if not has_image_payload(image):
        return False
    blip_fill = ET.Element(qn(A, "blipFill"))
    relationship_id, content_type = ctx.add_image_relationship_with_content_type(image)
    blip = ET.SubElement(blip_fill, qn(A, "blip"), {qn(R, "embed"): relationship_id})
    write_blip_alpha(blip, combined_alpha(fill.get("alpha"), image.get("alpha")))
    write_blip_image_effects(blip, merged_image_effects(image.get("effects"), effects))
    rewrite_svg_blip_extensions(
        blip,
        relationship_id,
        keep_svg=content_type == "image/svg+xml",
    )
    write_blip_fill_layout(blip_fill, image)
    insert_fill_child(container, blip_fill)
    return True

write_picture_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
