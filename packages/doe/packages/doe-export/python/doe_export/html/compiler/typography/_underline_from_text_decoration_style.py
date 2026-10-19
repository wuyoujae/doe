# Origin: pptx2html/htmlir/compiler.py::_underline_from_text_decoration_style
from __future__ import annotations

def _underline_from_text_decoration_style(style: str, width_pt: float | None) -> str:
    heavy = width_pt is not None and width_pt >= 1.5
    if style == "double":
        return "dbl"
    if style == "dotted":
        return "dottedHeavy" if heavy else "dotted"
    if style == "dashed":
        return "dashHeavy" if heavy else "dash"
    if style == "wavy":
        return "wavyHeavy" if heavy else "wavy"
    return "heavy" if heavy else "sng"

_underline_from_text_decoration_style.__module__ = 'pptx2html.htmlir.compiler'
