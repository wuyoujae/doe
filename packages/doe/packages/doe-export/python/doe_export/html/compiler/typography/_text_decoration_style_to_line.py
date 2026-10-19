# Origin: pptx2html/htmlir/compiler.py::_text_decoration_style_to_line
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._text_decoration_style import _text_decoration_style

def _text_decoration_style_to_line(value: Any) -> tuple[str | None, str | None]:
    style = _text_decoration_style(value)
    if style == "double":
        return "solid", "dbl"
    if style == "dotted":
        return "dot", None
    if style == "dashed":
        return "dash", None
    if style == "wavy":
        return "dashDot", None
    return "solid", None

_text_decoration_style_to_line.__module__ = 'pptx2html.htmlir.compiler'
