# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_direct_bounds
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Bounds, Optional

@staticmethod
def _build_direct_bounds(shape: BaseShape) -> Optional[Bounds]:
    if shape.left is None or shape.top is None:
        return None
    return Bounds(
        left=shape.left,
        top=shape.top,
        width=shape.width or 0.0,
        height=shape.height or 0.0,
    )

_build_direct_bounds.__func__.__module__ = 'pptx2html.ir.builder'
_build_direct_bounds.__func__.__qualname__ = 'PresentationBuilder._build_direct_bounds'
