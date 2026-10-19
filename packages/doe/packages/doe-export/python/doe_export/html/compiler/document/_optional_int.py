# Origin: pptx2html/htmlir/compiler.py::_optional_int
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _optional_int(value: Any) -> int | None:
    try:
        return int(value) if value is not None else None
    except Exception:
        return None

_optional_int.__module__ = 'pptx2html.htmlir.compiler'
