# Origin: pptx2html/ir/builder.py::PresentationBuilder._transition_duration_ms
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _transition_duration_ms(speed: Optional[str]) -> int:
    return {
        "fast": 350,
        "med": 700,
        "slow": 1000,
    }.get(speed or "med", 700)

_transition_duration_ms.__func__.__module__ = 'pptx2html.ir.builder'
_transition_duration_ms.__func__.__qualname__ = 'PresentationBuilder._transition_duration_ms'
