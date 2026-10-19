# Origin: pptx2html/htmlir/compiler.py::_svg_ellipse_path
from __future__ import annotations
from doe_export.html.compiler.svg._svg_point import _svg_point

def _svg_ellipse_path(
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    view_box: tuple[float, float, float, float],
) -> str | None:
    if rx <= 0 or ry <= 0:
        return None
    kappa = 0.5522847498307936
    commands = [
        f"M {_svg_point((cx + rx, cy), view_box)}",
        "C "
        + " ".join(
            [
                _svg_point((cx + rx, cy + ry * kappa), view_box),
                _svg_point((cx + rx * kappa, cy + ry), view_box),
                _svg_point((cx, cy + ry), view_box),
            ]
        ),
        "C "
        + " ".join(
            [
                _svg_point((cx - rx * kappa, cy + ry), view_box),
                _svg_point((cx - rx, cy + ry * kappa), view_box),
                _svg_point((cx - rx, cy), view_box),
            ]
        ),
        "C "
        + " ".join(
            [
                _svg_point((cx - rx, cy - ry * kappa), view_box),
                _svg_point((cx - rx * kappa, cy - ry), view_box),
                _svg_point((cx, cy - ry), view_box),
            ]
        ),
        "C "
        + " ".join(
            [
                _svg_point((cx + rx * kappa, cy - ry), view_box),
                _svg_point((cx + rx, cy - ry * kappa), view_box),
                _svg_point((cx + rx, cy), view_box),
            ]
        ),
        "Z",
    ]
    return " ".join(commands)

_svg_ellipse_path.__module__ = 'pptx2html.htmlir.compiler'
