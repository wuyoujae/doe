# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_group_bounds
from __future__ import annotations
from doe_export.ir.importer.shared import Bounds, GroupShape, Optional

@staticmethod
def _build_group_bounds(shape: GroupShape) -> Optional[Bounds]:
    if shape.group_left is None or shape.group_top is None:
        return None
    return Bounds(
        left=shape.group_left,
        top=shape.group_top,
        width=shape.group_width or 0.0,
        height=shape.group_height or 0.0,
    )

_build_group_bounds.__func__.__module__ = 'pptx2html.ir.builder'
_build_group_bounds.__func__.__qualname__ = 'PresentationBuilder._build_group_bounds'
