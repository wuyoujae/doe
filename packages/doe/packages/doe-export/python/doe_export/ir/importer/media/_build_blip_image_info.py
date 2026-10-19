# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_blip_image_info
from __future__ import annotations
from doe_export.ir.importer.shared import ET, ImageInfo, NAMESPACE, Optional, base64, emu_to_pt, percentage_to_float

def _build_blip_image_info(
    self,
    fill_elem: ET.Element,
    owner: object,
    img_part=None,
) -> Optional[ImageInfo]:
    _A = NAMESPACE.DML_MAIN
    blip = fill_elem.find(f"{{{_A}}}blip")
    if blip is None:
        return None
    if img_part is None:
        img_part = self._related_part_by_id(owner, self._blip_embed_id(blip))
    if img_part is None:
        return None
    content_type, blob = self._browser_ready_image_blob(
        getattr(img_part, "content_type", None) or "image/png",
        getattr(img_part, "blob", b""),
        getattr(getattr(img_part, "pack_uri", None), "membername", None),
    )
    b64 = base64.b64encode(blob).decode("ascii") if blob else ""
    preview_content_type, preview_blob = self._compressed_preview_image_blob(
        content_type,
        blob,
    )
    preview_b64 = (
        base64.b64encode(preview_blob).decode("ascii")
        if preview_blob
        else None
    )
    src_rect = fill_elem.find(f"{{{_A}}}srcRect")
    crop = self._drawingml_rect_percentages(src_rect)
    tile = fill_elem.find(f"{{{_A}}}tile")
    stretch_rect = fill_elem.find(f"{{{_A}}}stretch/{{{_A}}}fillRect")
    stretch = self._drawingml_rect_percentages(stretch_rect)
    intrinsic_width_pt, intrinsic_height_pt = self._image_intrinsic_size_pt(
        content_type,
        blob,
        fill_elem.get("dpi"),
    )
    return ImageInfo(
        content_type=content_type,
        data=b64,
        preview_content_type=preview_content_type,
        preview_data=preview_b64,
        embed_id=getattr(getattr(img_part, "pack_uri", None), "membername", None),
        crop_left=crop["left"] or 0.0,
        crop_right=crop["right"] or 0.0,
        crop_top=crop["top"] or 0.0,
        crop_bottom=crop["bottom"] or 0.0,
        alpha=self._alpha_from_color_transforms(blip),
        effects=self._build_blip_effects(blip),
        intrinsic_width_pt=intrinsic_width_pt,
        intrinsic_height_pt=intrinsic_height_pt,
        tile=tile is not None,
        tile_scale_x=percentage_to_float(tile.get("sx")) if tile is not None else None,
        tile_scale_y=percentage_to_float(tile.get("sy")) if tile is not None else None,
        tile_offset_x_pt=emu_to_pt(tile.get("tx")) if tile is not None else None,
        tile_offset_y_pt=emu_to_pt(tile.get("ty")) if tile is not None else None,
        tile_align=tile.get("algn") if tile is not None else None,
        tile_flip=tile.get("flip") if tile is not None else None,
        stretch_left=stretch["left"],
        stretch_right=stretch["right"],
        stretch_top=stretch["top"],
        stretch_bottom=stretch["bottom"],
    )

_build_blip_image_info.__module__ = 'pptx2html.ir.builder'
_build_blip_image_info.__qualname__ = 'PresentationBuilder._build_blip_image_info'
