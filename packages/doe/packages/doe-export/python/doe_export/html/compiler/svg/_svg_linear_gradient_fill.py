# Origin: pptx2html/htmlir/compiler.py::_svg_linear_gradient_fill
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Fill, GradientStop, math
from doe_export.html.compiler.css._css_color import _css_color

def _svg_linear_gradient_fill(node: dict[str, Any], bounds: Bounds, sx: float, sy: float) -> Fill | None:
    paint = node["svgGraphic"]["gradient"]
    start, end = paint["start"], paint["end"]
    dx, dy = (end["x"] - start["x"]) * sx, (end["y"] - start["y"]) * sy
    length = math.hypot(dx, dy)
    if length < .001:
        return None
    ux, uy = dx / length, dy / length
    projections = [x * ux + y * uy for x in (bounds.left, bounds.left + bounds.width)
                   for y in (bounds.top, bounds.top + bounds.height)]
    low, high = min(projections), max(projections)
    start_offset = start["x"] * sx * ux + start["y"] * sy * uy
    stops = []
    for stop in paint["stops"]:
        color = _css_color(stop["color"])
        if color is None:
            continue
        position = (start_offset + float(stop["position"]) * length - low) / max(high - low, .001)
        alpha = color[1] * float(stop["alpha"]) * float(node["svgGraphic"]["opacity"])
        stops.append(GradientStop(position=max(0, min(1, position)), color=color[0], alpha=alpha))
    return Fill(type="gradient", gradient_stops=stops, gradient_angle=math.degrees(math.atan2(dy, dx)) % 360,
                gradient_scaled=False) if stops else None

_svg_linear_gradient_fill.__module__ = 'pptx2html.htmlir.compiler'
