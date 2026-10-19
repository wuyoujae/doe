# Origin: pptx2html/htmlir/compiler.py::_svg_points
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _svg_points(raw: str) -> list[tuple[float, float]]:
    values = [
        float(match.group(0))
        for match in re.finditer(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", raw or "")
    ]
    points: list[tuple[float, float]] = []
    for index in range(0, len(values) - 1, 2):
        points.append((values[index], values[index + 1]))
    return points

_svg_points.__module__ = 'pptx2html.htmlir.compiler'
