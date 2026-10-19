# Origin: pptx2html/htmlir/compiler.py::_utf16_length
from __future__ import annotations

def _utf16_length(value: str) -> int:
    return len(str(value).encode("utf-16-le")) // 2

_utf16_length.__module__ = 'pptx2html.htmlir.compiler'
