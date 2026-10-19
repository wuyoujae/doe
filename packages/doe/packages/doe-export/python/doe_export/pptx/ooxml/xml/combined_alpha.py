# Origin: pptx2html/server/ooxml_pptx_writer.py::combined_alpha
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.xml.safe_float import safe_float

def combined_alpha(*values: Any) -> float | None:
    result = 1.0
    has_alpha = False
    for value in values:
        if value is None:
            continue
        has_alpha = True
        result *= max(0.0, min(1.0, safe_float(value, 1.0)))
    return result if has_alpha else None

combined_alpha.__module__ = 'pptx2html.server.ooxml_pptx_writer'
