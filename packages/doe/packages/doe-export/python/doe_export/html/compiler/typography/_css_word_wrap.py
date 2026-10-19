# Origin: pptx2html/htmlir/compiler.py::_css_word_wrap
from __future__ import annotations

def _css_word_wrap(white_space: str) -> bool:
    return white_space not in {"nowrap", "pre"}

_css_word_wrap.__module__ = 'pptx2html.htmlir.compiler'
