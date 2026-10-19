# Origin: pptx2html/htmlir/compiler.py::_svg_number
from __future__ import annotations

def _svg_number(value: float) -> str:
    if abs(value) < 0.0005:
        value = 0.0
    return f"{value:.3f}".rstrip("0").rstrip(".")

_svg_number.__module__ = 'pptx2html.htmlir.compiler'
