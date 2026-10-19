# Origin: pptx2html/ir/builder.py::PresentationBuilder._optional_float
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _optional_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

_optional_float.__func__.__module__ = 'pptx2html.ir.builder'
_optional_float.__func__.__qualname__ = 'PresentationBuilder._optional_float'
