# Origin: pptx2html/htmlir/compiler.py::_decoration_line_offsets
from __future__ import annotations

def _decoration_line_offsets(y: float, width_pt: float, style: str) -> list[float]:
    if style != "double":
        return [y]
    return [y - width_pt * 1.3, y + width_pt * 1.3]

_decoration_line_offsets.__module__ = 'pptx2html.htmlir.compiler'
