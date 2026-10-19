# Origin: pptx2html/ir/builder.py::PresentationBuilder._paragraph_level
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional

@staticmethod
def _paragraph_level(p_pr: Optional[ET.Element]) -> int:
    if p_pr is None:
        return 0
    try:
        return int(p_pr.get("lvl") or "0")
    except (TypeError, ValueError):
        return 0

_paragraph_level.__func__.__module__ = 'pptx2html.ir.builder'
_paragraph_level.__func__.__qualname__ = 'PresentationBuilder._paragraph_level'
