# Origin: pptx2html/htmlir/compiler.py::_strike_from_text_decoration_style
from __future__ import annotations

def _strike_from_text_decoration_style(style: str) -> str:
    return "dblStrike" if style == "double" else "sngStrike"

_strike_from_text_decoration_style.__module__ = 'pptx2html.htmlir.compiler'
