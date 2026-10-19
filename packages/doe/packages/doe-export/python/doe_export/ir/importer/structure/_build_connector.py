# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_connector
from __future__ import annotations
from doe_export.ir.importer.shared import Connector, Shape

def _build_connector(self, shape: Connector) -> Shape:
    geometry, geometry_info = self._build_geometry_info(shape, shape.connector_type)
    if geometry_info.paths:
        geometry_info.source = "connector"
    effects = self._build_effects(shape)
    three_d = self._build_three_d(shape)
    ir = Shape(
        type="connector",
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
        connector_type=shape.connector_type,
    )
    ir.diagnostics.extend(geometry_info.diagnostics)
    ir.diagnostics.extend(self._shape_render_diagnostics(shape))
    if ir.shadow and ir.shadow.diagnostics:
        ir.diagnostics.extend(ir.shadow.diagnostics)
    return ir

_build_connector.__module__ = 'pptx2html.ir.builder'
_build_connector.__qualname__ = 'PresentationBuilder._build_connector'
