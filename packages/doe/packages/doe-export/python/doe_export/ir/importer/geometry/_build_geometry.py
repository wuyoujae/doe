# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_geometry
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional

def _build_geometry(self, shape: BaseShape) -> Optional[str]:
    geometry = shape.auto_shape_type
    if geometry:
        return geometry

    for inherited_shape in self._placeholder_sources(shape):
        geometry = inherited_shape.auto_shape_type
        if geometry:
            return geometry

    return None

_build_geometry.__module__ = 'pptx2html.ir.builder'
_build_geometry.__qualname__ = 'PresentationBuilder._build_geometry'
