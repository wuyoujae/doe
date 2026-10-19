# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_bounds
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Bounds, Optional

def _build_bounds(self, shape: BaseShape) -> Optional[Bounds]:
    bounds = self._build_direct_bounds(shape)
    if bounds is not None:
        return bounds

    for inherited_shape in self._placeholder_sources(shape):
        bounds = self._build_direct_bounds(inherited_shape)
        if bounds is not None:
            return bounds

    return None

_build_bounds.__module__ = 'pptx2html.ir.builder'
_build_bounds.__qualname__ = 'PresentationBuilder._build_bounds'
