# Origin: pptx2html/htmlir/compiler.py::_text_decoration_style
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _text_decoration_style(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"double", "dotted", "dashed", "wavy"}:
        return raw
    return "solid"

_text_decoration_style.__module__ = 'pptx2html.htmlir.compiler'
