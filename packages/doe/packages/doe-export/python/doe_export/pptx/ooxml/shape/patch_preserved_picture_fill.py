# Origin: pptx2html/server/ooxml_pptx_writer.py::patch_preserved_picture_fill
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shared import A
from doe_export.pptx.ooxml.xml.combined_alpha import combined_alpha
from doe_export.pptx.ooxml.assets.merged_image_effects import merged_image_effects
from doe_export.pptx.ooxml.xml.qn import qn
from doe_export.pptx.ooxml.xml.write_blip_alpha import write_blip_alpha
from doe_export.pptx.ooxml.shape.write_blip_fill_layout import write_blip_fill_layout
from doe_export.pptx.ooxml.assets.write_blip_image_effects import write_blip_image_effects

def patch_preserved_picture_fill(
    blip_fill: ET.Element,
    fill: dict[str, Any],
    *,
    effects: list[dict[str, Any]] | None = None,
) -> None:
    """Update picture geometry/effects without replacing Office SVG relations."""
    image = fill.get("image") or {}
    blip = blip_fill.find(qn(A, "blip"))
    if blip is None:
        raise ValueError("Source picture fill is missing its blip")
    write_blip_alpha(blip, combined_alpha(fill.get("alpha"), image.get("alpha")))
    write_blip_image_effects(blip, merged_image_effects(image.get("effects"), effects))
    write_blip_fill_layout(blip_fill, image)

patch_preserved_picture_fill.__module__ = 'pptx2html.server.ooxml_pptx_writer'
