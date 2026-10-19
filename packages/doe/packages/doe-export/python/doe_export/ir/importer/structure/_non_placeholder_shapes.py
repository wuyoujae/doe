# Origin: pptx2html/ir/builder.py::PresentationBuilder._non_placeholder_shapes
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, BaseSlidePart

@staticmethod
def _non_placeholder_shapes(part: BaseSlidePart) -> list[BaseShape]:
    return [shape for shape in part.shapes if not shape.is_placeholder]

_non_placeholder_shapes.__func__.__module__ = 'pptx2html.ir.builder'
_non_placeholder_shapes.__func__.__qualname__ = 'PresentationBuilder._non_placeholder_shapes'
