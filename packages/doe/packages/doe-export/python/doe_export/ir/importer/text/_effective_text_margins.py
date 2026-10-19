# Origin: pptx2html/ir/builder.py::PresentationBuilder._effective_text_margins
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, _DEFAULT_TEXT_MARGINS_PT

@staticmethod
def _effective_text_margins(
    margins: Optional[dict[str, Optional[float]]],
) -> dict[str, Optional[float]]:
    values = margins or {}
    return {
        key: values.get(key) if values.get(key) is not None else default
        for key, default in _DEFAULT_TEXT_MARGINS_PT.items()
    }

_effective_text_margins.__func__.__module__ = 'pptx2html.ir.builder'
_effective_text_margins.__func__.__qualname__ = 'PresentationBuilder._effective_text_margins'
