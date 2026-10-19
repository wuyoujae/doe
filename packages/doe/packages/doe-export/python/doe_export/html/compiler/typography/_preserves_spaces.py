# Origin: pptx2html/htmlir/compiler.py::_preserves_spaces
from __future__ import annotations

def _preserves_spaces(white_space: str) -> bool:
    return white_space in {"pre", "pre-wrap", "break-spaces"}

_preserves_spaces.__module__ = 'pptx2html.htmlir.compiler'
