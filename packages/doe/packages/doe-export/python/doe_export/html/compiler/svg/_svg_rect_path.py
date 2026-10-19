# Origin: pptx2html/htmlir/compiler.py::_svg_rect_path
from __future__ import annotations
from doe_export.html.compiler.svg._svg_point import _svg_point
from doe_export.html.compiler.svg._svg_points_to_path import _svg_points_to_path

def _svg_rect_path(
    x: float,
    y: float,
    width: float,
    height: float,
    rx: float,
    ry: float,
    view_box: tuple[float, float, float, float],
) -> str | None:
    rx = min(max(0.0, rx), width / 2.0)
    ry = min(max(0.0, ry), height / 2.0)
    if rx <= 0 or ry <= 0:
        return _svg_points_to_path(
            [(x, y), (x + width, y), (x + width, y + height), (x, y + height)],
            view_box,
            close=True,
        )
    kappa = 0.5522847498307936
    commands = [
        f"M {_svg_point((x + rx, y), view_box)}",
        f"L {_svg_point((x + width - rx, y), view_box)}",
        "C "
        + " ".join(
            [
                _svg_point((x + width - rx + rx * kappa, y), view_box),
                _svg_point((x + width, y + ry - ry * kappa), view_box),
                _svg_point((x + width, y + ry), view_box),
            ]
        ),
        f"L {_svg_point((x + width, y + height - ry), view_box)}",
        "C "
        + " ".join(
            [
                _svg_point((x + width, y + height - ry + ry * kappa), view_box),
                _svg_point((x + width - rx + rx * kappa, y + height), view_box),
                _svg_point((x + width - rx, y + height), view_box),
            ]
        ),
        f"L {_svg_point((x + rx, y + height), view_box)}",
        "C "
        + " ".join(
            [
                _svg_point((x + rx - rx * kappa, y + height), view_box),
                _svg_point((x, y + height - ry + ry * kappa), view_box),
                _svg_point((x, y + height - ry), view_box),
            ]
        ),
        f"L {_svg_point((x, y + ry), view_box)}",
        "C "
        + " ".join(
            [
                _svg_point((x, y + ry - ry * kappa), view_box),
                _svg_point((x + rx - rx * kappa, y), view_box),
                _svg_point((x + rx, y), view_box),
            ]
        ),
        "Z",
    ]
    return " ".join(commands)

_svg_rect_path.__module__ = 'pptx2html.htmlir.compiler'
