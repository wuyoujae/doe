# Origin: pptx2html/ir/builder.py::PresentationBuilder._optional_int
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _optional_int(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

_optional_int.__func__.__module__ = 'pptx2html.ir.builder'
_optional_int.__func__.__qualname__ = 'PresentationBuilder._optional_int'
