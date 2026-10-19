# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_shape
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, Shape

def _build_shape(self, shape: BaseShape) -> Optional[Shape]:
    previous_owner = self._active_color_owner
    self._active_color_owner = getattr(shape, "_color_owner_override", shape)
    try:
        return self._build_shape_for_owner(shape)
    finally:
        self._active_color_owner = previous_owner

_build_shape.__module__ = 'pptx2html.ir.builder'
_build_shape.__qualname__ = 'PresentationBuilder._build_shape'
