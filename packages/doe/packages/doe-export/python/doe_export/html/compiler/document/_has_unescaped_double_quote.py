# Origin: pptx2html/htmlir/compiler.py::_has_unescaped_double_quote
from __future__ import annotations

def _has_unescaped_double_quote(value: str) -> bool:
    backslashes = 0
    for character in value:
        if character == '"' and backslashes % 2 == 0:
            return True
        backslashes = backslashes + 1 if character == "\\" else 0
    return False

_has_unescaped_double_quote.__module__ = 'pptx2html.htmlir.compiler'
