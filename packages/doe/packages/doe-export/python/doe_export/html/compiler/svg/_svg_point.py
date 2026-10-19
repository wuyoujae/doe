# Origin: pptx2html/htmlir/compiler.py::_svg_point
from __future__ import annotations
from doe_export.html.compiler.svg._svg_number import _svg_number

def _svg_point(point: tuple[float, float], view_box: tuple[float, float, float, float]) -> str:
    min_x, min_y, view_width, view_height = view_box
    x = (point[0] - min_x) * 100.0 / max(view_width, 0.001)
    y = (point[1] - min_y) * 100.0 / max(view_height, 0.001)
    return f"{_svg_number(x)} {_svg_number(y)}"

_svg_point.__module__ = 'pptx2html.htmlir.compiler'
