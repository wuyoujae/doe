# Origin: pptx2html/htmlir/compiler.py::_gradient_fill
from __future__ import annotations
from doe_export.html.compiler.shared import Fill, GradientStop
from doe_export.html.compiler.css._css_function_arguments import _css_function_arguments
from doe_export.html.compiler.css._css_gradient_angle import _css_gradient_angle
from doe_export.html.compiler.css._css_gradient_stop_position import _css_gradient_stop_position
from doe_export.html.compiler.css._first_css_color import _first_css_color
from doe_export.html.compiler.css._split_css_function_args import _split_css_function_args

def _gradient_fill(value: str, opacity: float = 1.0) -> Fill | None:
    lowered = value.strip().lower()
    if "gradient(" not in lowered:
        color = _first_css_color(value)
        if color:
            alpha = color[1] * opacity
            return Fill(type="solid", color=color[0], alpha=alpha if alpha < 0.999 else None)
        return None

    args = _css_function_arguments(value)
    parts = _split_css_function_args(args)
    if not parts:
        return None
    first_color_index = 0
    for index, part in enumerate(parts):
        if _first_css_color(part) is not None:
            first_color_index = index
            break
    preamble = " ".join(parts[:first_color_index]).strip().lower()
    stop_parts = parts[first_color_index:]
    stops: list[tuple[str, float, float | None]] = []
    for part in stop_parts:
        color = _first_css_color(part)
        if color is None:
            continue
        alpha = color[1] * opacity
        stops.append((color[0], alpha, _css_gradient_stop_position(part)))

    if not stops:
        return None
    if all(alpha <= 0.01 for _color, alpha, _position in stops):
        return None
    if len(stops) == 1:
        color, alpha, _position = stops[0]
        return Fill(type="solid", color=color, alpha=alpha if alpha < 0.999 else None)

    denominator = max(1, len(stops) - 1)
    gradient_stops: list[GradientStop] = []
    for index, (color, alpha, position) in enumerate(stops):
        resolved_position = index / denominator if position is None else max(0.0, min(1.0, position))
        gradient_stops.append(
            GradientStop(position=resolved_position, color=color, alpha=alpha if alpha < 0.999 else None)
        )

    return Fill(
        type="gradient",
        gradient_angle=_css_gradient_angle(preamble),
        gradient_path="circle" if "radial-gradient" in lowered else None,
        gradient_stops=gradient_stops,
    )

_gradient_fill.__module__ = 'pptx2html.htmlir.compiler'
