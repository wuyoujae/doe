# Origin: pptx2html/ir/builder.py::PresentationBuilder._centipoints_to_pt
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

@staticmethod
def _centipoints_to_pt(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    try:
        return int(value) / 100.0
    except (ValueError, TypeError):
        return None

_centipoints_to_pt.__func__.__module__ = 'pptx2html.ir.builder'
_centipoints_to_pt.__func__.__qualname__ = 'PresentationBuilder._centipoints_to_pt'
