# Origin: pptx2html/htmlir/compiler.py::_rounded_rect_svg_path
from __future__ import annotations
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import math

def _rounded_rect_svg_path(radii: list[tuple[float, float]], bounds: Bounds) -> str:
    if len(radii) != 4 or bounds.width <= 0 or bounds.height <= 0:
        return ""
    width = bounds.width
    height = bounds.height
    tl, tr, br, bl = [(x, y) if x > 0.01 and y > 0.01 else (0.0, 0.0) for x, y in radii]
    commands: list[str] = []

    def add(x: float, y: float) -> None:
        nx = 100.0 * max(0.0, min(width, x)) / width
        ny = 100.0 * max(0.0, min(height, y)) / height
        commands.append(f"{'L' if commands else 'M'} {nx:.3f} {ny:.3f}")

    def arc(cx: float, cy: float, rx: float, ry: float, start_deg: float, end_deg: float) -> None:
        if rx <= 0.01 or ry <= 0.01:
            return
        start, end = math.radians(start_deg), math.radians(end_deg)
        k = 4.0 / 3.0 * math.tan((end - start) / 4.0)
        points = [
            (cx + rx * (math.cos(start) - k * math.sin(start)), cy + ry * (math.sin(start) + k * math.cos(start))),
            (cx + rx * (math.cos(end) + k * math.sin(end)), cy + ry * (math.sin(end) - k * math.cos(end))),
            (cx + rx * math.cos(end), cy + ry * math.sin(end)),
        ]
        commands.append("C " + " ".join(f"{100 * x / width:.3f} {100 * y / height:.3f}" for x, y in points))

    add(tl[0], 0.0)
    add(width - tr[0], 0.0)
    if tr[0] > 0.01 or tr[1] > 0.01:
        arc(width - tr[0], tr[1], tr[0], tr[1], -90.0, 0.0)
    else:
        add(width, 0.0)
    add(width, height - br[1])
    if br[0] > 0.01 or br[1] > 0.01:
        arc(width - br[0], height - br[1], br[0], br[1], 0.0, 90.0)
    else:
        add(width, height)
    add(bl[0], height)
    if bl[0] > 0.01 or bl[1] > 0.01:
        arc(bl[0], height - bl[1], bl[0], bl[1], 90.0, 180.0)
    else:
        add(0.0, height)
    add(0.0, tl[1])
    if tl[0] > 0.01 or tl[1] > 0.01:
        arc(tl[0], tl[1], tl[0], tl[1], 180.0, 270.0)
    else:
        add(0.0, 0.0)

    if len(commands) < 3:
        return ""
    commands.append("Z")
    return " ".join(commands)

_rounded_rect_svg_path.__module__ = 'pptx2html.htmlir.compiler'
