# Origin: pptx2html/htmlir/compiler.py::_diagnostic_value
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re

def _diagnostic_value(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    normalized = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return normalized[:48]

_diagnostic_value.__module__ = 'pptx2html.htmlir.compiler'
