# Origin: pptx2html/htmlir/compiler.py::_wavy_decoration_path
from __future__ import annotations

def _wavy_decoration_path() -> str:
    points = ["M 0 50"]
    segments = 32
    for index in range(1, segments + 1):
        x = 100.0 * index / segments
        y = 50.0 + (25.0 if index % 2 else -25.0)
        points.append(f"L {x:.3f} {y:.3f}")
    return " ".join(points)

_wavy_decoration_path.__module__ = 'pptx2html.htmlir.compiler'
