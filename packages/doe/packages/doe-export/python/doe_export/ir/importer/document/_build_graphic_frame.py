# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_graphic_frame
from __future__ import annotations
from doe_export.ir.importer.shared import GraphicFrame, Shape

def _build_graphic_frame(self, shape: GraphicFrame) -> Shape:
    smartart_group = self._build_smartart_cached_group(shape)
    if smartart_group is not None:
        return smartart_group

    effects = self._build_effects(shape)
    three_d = self._build_three_d(shape)
    smartart_text = self._build_smartart_text_frame(shape)
    ir = Shape(
        type="graphic_frame",
        name=shape.name,
        shape_id=shape.shape_id,
        hidden=shape.hidden,
        bounds=self._build_bounds(shape),
        rotation=shape.rotation,
        flip_horizontal=self._build_flip(shape, "flipH"),
        flip_vertical=self._build_flip(shape, "flipV"),
        has_chart=shape.has_chart,
        chart_r_id=shape.chart_r_id,
        chart=self._build_chart(shape) if shape.has_chart else None,
        graphic_uri=shape.uri,
        shadow=self._primary_shadow(effects),
        effects=effects,
        three_d=three_d,
        text=smartart_text,
    )
    if shape.has_table:
        ir.table = self._build_table(shape)
    ir.diagnostics.extend(self._shape_render_diagnostics(shape))
    if ir.shadow and ir.shadow.diagnostics:
        ir.diagnostics.extend(ir.shadow.diagnostics)
    if shape.uri and not shape.has_table and not shape.has_chart:
        if smartart_text is not None:
            ir.diagnostics.append("SmartArt diagram geometry is not rendered; text fallback extracted")
        else:
            ir.diagnostics.append(f"Unsupported graphicData URI: {shape.uri}")
    return ir

_build_graphic_frame.__module__ = 'pptx2html.ir.builder'
_build_graphic_frame.__qualname__ = 'PresentationBuilder._build_graphic_frame'
