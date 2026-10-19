# Origin: pptx2html/ir/builder.py::PresentationBuilder._angle_to_degrees
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _angle_to_degrees(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    try:
        return int(value) / 60000.0
    except (ValueError, TypeError):
        return None

_angle_to_degrees.__func__.__module__ = 'pptx2html.ir.builder'
_angle_to_degrees.__func__.__qualname__ = 'PresentationBuilder._angle_to_degrees'
