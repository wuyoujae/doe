# Origin: pptx2html/htmlir/compiler.py::_preserves_newlines
from __future__ import annotations

def _preserves_newlines(white_space: str) -> bool:
    return white_space in {"pre", "pre-wrap", "pre-line", "break-spaces"}

_preserves_newlines.__module__ = 'pptx2html.htmlir.compiler'
