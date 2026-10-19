# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_shape_for_owner
from __future__ import annotations
from doe_export.ir.importer.shared import AutoShape, BaseShape, Connector, GraphicFrame, GroupShape, Optional, Picture, Shape

def _build_shape_for_owner(self, shape: BaseShape) -> Optional[Shape]:
    if isinstance(shape, AutoShape):
        return self._build_auto_shape(shape)
    if isinstance(shape, Picture):
        return self._build_picture(shape)
    if isinstance(shape, Connector):
        return self._build_connector(shape)
    if isinstance(shape, GroupShape):
        return self._build_group(shape)
    if isinstance(shape, GraphicFrame):
        return self._build_graphic_frame(shape)
    # fallback — treat as auto_shape
    return self._build_auto_shape(shape)

_build_shape_for_owner.__module__ = 'pptx2html.ir.builder'
_build_shape_for_owner.__qualname__ = 'PresentationBuilder._build_shape_for_owner'
