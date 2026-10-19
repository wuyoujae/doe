# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_placeholder
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, PlaceholderInfo

@staticmethod
def _build_placeholder(shape: BaseShape) -> Optional[PlaceholderInfo]:
    ph = shape.placeholder_shape
    if ph is not None:
        return PlaceholderInfo(
            type=ph.type,
            idx=ph.idx,
            orientation=ph.orientation,
            size=ph.size,
        )
    return None

_build_placeholder.__func__.__module__ = 'pptx2html.ir.builder'
_build_placeholder.__func__.__qualname__ = 'PresentationBuilder._build_placeholder'
