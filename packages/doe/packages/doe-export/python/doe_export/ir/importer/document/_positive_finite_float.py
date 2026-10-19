# Origin: pptx2html/ir/builder.py::PresentationBuilder._positive_finite_float
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, math

@staticmethod
def _positive_finite_float(value: object) -> Optional[float]:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) and result > 0 else None

_positive_finite_float.__func__.__module__ = 'pptx2html.ir.builder'
_positive_finite_float.__func__.__qualname__ = 'PresentationBuilder._positive_finite_float'
