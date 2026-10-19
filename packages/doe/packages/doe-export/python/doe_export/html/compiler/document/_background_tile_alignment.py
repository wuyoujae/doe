# Origin: pptx2html/htmlir/compiler.py::_background_tile_alignment
from __future__ import annotations

def _background_tile_alignment(position_x: float, position_y: float) -> str:
    horizontal = "l" if position_x < 0.25 else "r" if position_x > 0.75 else "ctr"
    vertical = "t" if position_y < 0.25 else "b" if position_y > 0.75 else "ctr"
    if horizontal == "ctr" and vertical == "ctr":
        return "ctr"
    if horizontal == "ctr":
        return vertical
    if vertical == "ctr":
        return horizontal
    return f"{vertical}{horizontal}"

_background_tile_alignment.__module__ = 'pptx2html.htmlir.compiler'
