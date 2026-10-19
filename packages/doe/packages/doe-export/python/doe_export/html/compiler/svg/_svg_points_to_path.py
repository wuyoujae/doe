# Origin: pptx2html/htmlir/compiler.py::_svg_points_to_path
from __future__ import annotations
from doe_export.html.compiler.svg._svg_point import _svg_point

def _svg_points_to_path(
    points: list[tuple[float, float]],
    view_box: tuple[float, float, float, float],
    *,
    close: bool,
) -> str | None:
    if len(points) < 2:
        return None
    commands = [f"M {_svg_point(points[0], view_box)}"]
    commands.extend(f"L {_svg_point(point, view_box)}" for point in points[1:])
    if close:
        commands.append("Z")
    return " ".join(commands)

_svg_points_to_path.__module__ = 'pptx2html.htmlir.compiler'
