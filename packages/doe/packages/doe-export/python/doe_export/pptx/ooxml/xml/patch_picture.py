# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_picture
from __future__ import annotations
from doe_export.pptx.ooxml.package.SlideContext import SlideContext
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import R, has_image_payload
from doe_export.pptx.ooxml.xml.find_or_create import find_or_create
from doe_export.pptx.ooxml.assets.image_payload_changed import image_payload_changed
from doe_export.pptx.ooxml.assets.merged_image_effects import merged_image_effects
from doe_export.pptx.ooxml.shape.patch_common_shape_props import patch_common_shape_props
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.geometry.rewrite_svg_blip_extensions import rewrite_svg_blip_extensions
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed
from doe_export.pptx.ooxml.xml.write_blip_alpha import write_blip_alpha
from doe_export.pptx.ooxml.shape.write_blip_fill_layout import write_blip_fill_layout
from doe_export.pptx.ooxml.assets.write_blip_image_effects import write_blip_image_effects

def patch_picture(ctx: SlideContext, elem: ET.Element, shape: dict[str, Any], original: dict[str, Any] | None) -> None:
    patch_common_shape_props(ctx, elem, shape, original)
    image = shape.get("image") or {}
    original_image = (original or {}).get("image") or {}
    image_changed = shape_changed(image, original_image)
    effects = merged_image_effects(image.get("effects"), shape.get("effects"))
    original_effects = merged_image_effects(
        original_image.get("effects"),
        (original or {}).get("effects"),
    )
    effects_changed = shape_changed(effects, original_effects)
    if not image_changed and not effects_changed:
        return

    blip_fill = find_or_create(elem, [("p", "blipFill")])
    blip = find_or_create(blip_fill, [("a", "blip")])
    if image_changed:
        # Crop/tile/stretch/alpha edits intentionally keep the source
        # relationship. Only a real payload replacement creates a new media
        # part and relationship, leaving the original package otherwise intact.
        if image_payload_changed(image, original_image) and has_image_payload(image):
            replacement_id, content_type = ctx.add_image_relationship_with_content_type(image)
            blip.set(qn(R, "embed"), replacement_id)
            blip.attrib.pop(qn(R, "link"), None)
            rewrite_svg_blip_extensions(
                blip,
                replacement_id,
                keep_svg=content_type == "image/svg+xml",
            )
        write_blip_alpha(blip, image.get("alpha"))
        write_blip_fill_layout(blip_fill, image)
    if effects_changed:
        write_blip_image_effects(blip, effects)

patch_picture.__module__ = 'pptx2html.server.ooxml_pptx_writer'
