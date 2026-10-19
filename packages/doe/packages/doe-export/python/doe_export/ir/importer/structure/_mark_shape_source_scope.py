# Origin: pptx2html/ir/builder.py::PresentationBuilder._mark_shape_source_scope
from __future__ import annotations
from doe_export.ir.importer.shared import Shape

@staticmethod
def _mark_shape_source_scope(shape: Shape, source_scope: str) -> None:
    from pptx2html.ir.builder import PresentationBuilder
    shape.source_scope = source_scope
    for child in shape.shapes or []:
        PresentationBuilder._mark_shape_source_scope(child, source_scope)

_mark_shape_source_scope.__func__.__module__ = 'pptx2html.ir.builder'
_mark_shape_source_scope.__func__.__qualname__ = 'PresentationBuilder._mark_shape_source_scope'
