# Origin: pptx2html/htmlir/compiler.py::_svg_arc_to_cubic_segments
from __future__ import annotations
from doe_export.html.compiler.shared import math

def _svg_arc_to_cubic_segments(
    start: tuple[float, float],
    end: tuple[float, float],
    rx: float,
    ry: float,
    x_axis_rotation: float,
    large_arc: bool,
    sweep: bool,
) -> list[tuple[tuple[float, float], tuple[float, float], tuple[float, float]]]:
    x1, y1 = start
    x2, y2 = end
    if rx <= 0 or ry <= 0 or (abs(x1 - x2) < 1e-9 and abs(y1 - y2) < 1e-9):
        return []
    phi = math.radians(x_axis_rotation % 360.0)
    cos_phi = math.cos(phi)
    sin_phi = math.sin(phi)
    dx = (x1 - x2) / 2.0
    dy = (y1 - y2) / 2.0
    x1p = cos_phi * dx + sin_phi * dy
    y1p = -sin_phi * dx + cos_phi * dy
    radii_check = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if radii_check > 1:
        scale = math.sqrt(radii_check)
        rx *= scale
        ry *= scale
    denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    if denominator <= 0:
        return []
    numerator = max(0.0, rx * rx * ry * ry - denominator)
    sign = -1.0 if large_arc == sweep else 1.0
    coef = sign * math.sqrt(numerator / denominator)
    cxp = coef * (rx * y1p / ry)
    cyp = coef * (-ry * x1p / rx)
    cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2.0
    cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2.0

    def vector_angle(u: tuple[float, float], v: tuple[float, float]) -> float:
        dot = max(-1.0, min(1.0, u[0] * v[0] + u[1] * v[1]))
        cross = u[0] * v[1] - u[1] * v[0]
        return math.copysign(math.acos(dot), cross)

    start_vector = ((x1p - cxp) / rx, (y1p - cyp) / ry)
    end_vector = ((-x1p - cxp) / rx, (-y1p - cyp) / ry)
    theta1 = vector_angle((1.0, 0.0), start_vector)
    delta = vector_angle(start_vector, end_vector)
    if not sweep and delta > 0:
        delta -= 2 * math.pi
    elif sweep and delta < 0:
        delta += 2 * math.pi
    segment_count = max(1, int(math.ceil(abs(delta) / (math.pi / 2.0))))
    delta_per_segment = delta / segment_count

    def transform(unit_x: float, unit_y: float) -> tuple[float, float]:
        return (
            cx + rx * (cos_phi * unit_x - sin_phi * unit_y),
            cy + ry * (sin_phi * unit_x + cos_phi * unit_y),
        )

    segments: list[tuple[tuple[float, float], tuple[float, float], tuple[float, float]]] = []
    current_angle = theta1
    for _ in range(segment_count):
        next_angle = current_angle + delta_per_segment
        alpha = 4.0 / 3.0 * math.tan((next_angle - current_angle) / 4.0)
        p1 = (
            math.cos(current_angle) - alpha * math.sin(current_angle),
            math.sin(current_angle) + alpha * math.cos(current_angle),
        )
        p2 = (
            math.cos(next_angle) + alpha * math.sin(next_angle),
            math.sin(next_angle) - alpha * math.cos(next_angle),
        )
        p3 = (math.cos(next_angle), math.sin(next_angle))
        segments.append((transform(*p1), transform(*p2), transform(*p3)))
        current_angle = next_angle
    return segments

_svg_arc_to_cubic_segments.__module__ = 'pptx2html.htmlir.compiler'
