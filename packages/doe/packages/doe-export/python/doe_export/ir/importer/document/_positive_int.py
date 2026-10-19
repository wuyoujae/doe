# Origin: pptx2html/ir/builder.py::PresentationBuilder._positive_int
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _positive_int(value: Optional[str], default: int = 1) -> int:
    try:
        parsed = int(value) if value is not None else default
    except (ValueError, TypeError):
        return default
    return max(1, parsed)

_positive_int.__func__.__module__ = 'pptx2html.ir.builder'
_positive_int.__func__.__qualname__ = 'PresentationBuilder._positive_int'
