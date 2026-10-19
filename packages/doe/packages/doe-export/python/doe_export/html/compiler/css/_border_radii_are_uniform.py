# Origin: pptx2html/htmlir/compiler.py::_border_radii_are_uniform
from __future__ import annotations

def _border_radii_are_uniform(radii: list[tuple[float, float]]) -> bool:
    if len(radii) != 4:
        return False
    first = radii[0]
    return all(abs(horizontal - first[0]) <= 0.05 and abs(vertical - first[1]) <= 0.05 for horizontal, vertical in radii[1:])

_border_radii_are_uniform.__module__ = 'pptx2html.htmlir.compiler'
