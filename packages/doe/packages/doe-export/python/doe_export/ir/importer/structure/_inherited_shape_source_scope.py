# Origin: pptx2html/ir/builder.py::PresentationBuilder._inherited_shape_source_scope
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, SlidePart

@staticmethod
def _inherited_shape_source_scope(shape: BaseShape, slide_part: SlidePart) -> str:
    owner = getattr(shape, "part", None)
    layout = getattr(slide_part, "slide_layout", None)
    master = getattr(layout, "slide_master", None) if layout is not None else None
    if owner is layout:
        return "layout"
    if owner is master:
        return "master"
    return "master"

_inherited_shape_source_scope.__func__.__module__ = 'pptx2html.ir.builder'
_inherited_shape_source_scope.__func__.__qualname__ = 'PresentationBuilder._inherited_shape_source_scope'
