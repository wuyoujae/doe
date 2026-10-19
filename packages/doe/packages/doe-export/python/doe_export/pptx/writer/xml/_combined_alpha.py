# Origin: pptx2html/server/pptx_writer.py::_combined_alpha
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.xml._safe_float import _safe_float

def _combined_alpha(*values: Any) -> float | None:
    result = 1.0
    has_alpha = False
    for value in values:
        if value is None:
            continue
        has_alpha = True
        result *= max(0.0, min(1.0, _safe_float(value, 1.0)))
    return result if has_alpha else None

_combined_alpha.__module__ = 'pptx2html.server.pptx_writer'
