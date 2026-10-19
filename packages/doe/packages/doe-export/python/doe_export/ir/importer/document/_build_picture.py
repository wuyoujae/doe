# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_picture
from __future__ import annotations
from doe_export.ir.importer.shared import NAMESPACE, Picture, Shape

def _build_picture(self, shape: Picture) -> Shape:
    img_part = shape.image_part
    blip_fill = shape._element.find(f"{{{NAMESPACE.PML_MAIN}}}blipFill")
    image_info = (
        self._build_blip_image_info(blip_fill, shape, img_part)
        if blip_fill is not None and img_part is not None
        else None
    )

    geometry, geometry_info = self._build_geometry_info(shape)
    effects = self._build_effects(shape)
    three_d = self._build_three_d(shape)
    ir = Shape(
        type="picture",
        name=shape.name,
        shape_id=shape.shape_id,
        hidden=shape.hidden,
        bounds=self._build_bounds(shape),
        rotation=shape.rotation,
        flip_horizontal=self._build_flip(shape, "flipH"),
        flip_vertical=self._build_flip(shape, "flipV"),
        geometry=geometry,
        geometry_source=geometry_info.source,
        geometry_adjustments=geometry_info.adjustments,
        geometry_paths=geometry_info.paths,
        text_rect=geometry_info.text_rect,
        fill=self._build_fill(shape),
        border=self._build_border(shape),
        shadow=self._primary_shadow(effects),
        effects=effects,
        three_d=three_d,
        text=self._build_text_frame(shape),
        image=image_info,
        placeholder=self._build_placeholder(shape),
    )
    ir.diagnostics.extend(geometry_info.diagnostics)
    ir.diagnostics.extend(self._shape_render_diagnostics(shape))
    if image_info is None or not any(
        str(getattr(image_info, field, "") or "").strip()
        for field in ("preview_data", "data", "url")
    ):
        ir.diagnostics.append(
            "Picture source is unavailable; renderers use a non-blocking placeholder"
        )
    if ir.shadow and ir.shadow.diagnostics:
        ir.diagnostics.extend(ir.shadow.diagnostics)
    return ir

_build_picture.__module__ = 'pptx2html.ir.builder'
_build_picture.__qualname__ = 'PresentationBuilder._build_picture'
