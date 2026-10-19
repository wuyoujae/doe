# Origin: pptx2html/ir/builder.py::PresentationBuilder._duration_ms
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _duration_ms(value: Optional[str]) -> Optional[int]:
    if value is None or value in {"", "indefinite"}:
        return None
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        return None

_duration_ms.__func__.__module__ = 'pptx2html.ir.builder'
_duration_ms.__func__.__qualname__ = 'PresentationBuilder._duration_ms'
