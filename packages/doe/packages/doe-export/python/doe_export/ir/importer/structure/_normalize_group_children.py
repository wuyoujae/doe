# Origin: pptx2html/ir/builder.py::PresentationBuilder._normalize_group_children
from __future__ import annotations
from doe_export.ir.importer.shared import Bounds, Optional, Shape

@staticmethod
def _normalize_group_children(
    children: list[Shape],
    bounds: Optional[Bounds],
    group_bounds: Optional[Bounds],
) -> None:
    if (
        bounds is None
        or group_bounds is None
        or not group_bounds.width
        or not group_bounds.height
    ):
        return
    scale_x = bounds.width / group_bounds.width
    scale_y = bounds.height / group_bounds.height
    for child in children:
        if child.bounds is None:
            continue
        child.bounds = Bounds(
            left=(child.bounds.left - group_bounds.left) * scale_x,
            top=(child.bounds.top - group_bounds.top) * scale_y,
            width=child.bounds.width * scale_x,
            height=child.bounds.height * scale_y,
        )

_normalize_group_children.__func__.__module__ = 'pptx2html.ir.builder'
_normalize_group_children.__func__.__qualname__ = 'PresentationBuilder._normalize_group_children'
