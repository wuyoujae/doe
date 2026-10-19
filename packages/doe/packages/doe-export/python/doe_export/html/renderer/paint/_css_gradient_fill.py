# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_gradient_fill
from __future__ import annotations
from doe_export.html.renderer.shared import Fill

def _css_gradient_fill(self, fill: Fill) -> str:
    stops = []
    for stop in fill.gradient_stops:
        color = self._css_color(stop.color)
        if not color:
            continue
        if stop.alpha is not None and stop.alpha < 1.0:
            raw = color.lstrip("#")
            color = f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},{int(raw[4:6], 16)},{stop.alpha:.3f})"
        stops.append(f"{color} {max(0.0, min(1.0, stop.position or 0.0)) * 100:.1f}%")
    if not stops:
        return ""
    if fill.gradient_path and fill.gradient_path != "none":
        left = fill.gradient_fill_to_left
        right = fill.gradient_fill_to_right
        top = fill.gradient_fill_to_top
        bottom = fill.gradient_fill_to_bottom
        values = (left, right, top, bottom)
        if all(value is not None and 0 <= value <= 1 for value in values):
            cx = ((left or 0) + (1 - (right or 0))) * 50
            cy = ((top or 0) + (1 - (bottom or 0))) * 50
            radius = max(1.0, (1 - (left or 0) - (right or 0)) * 50, (1 - (top or 0) - (bottom or 0)) * 50)
            return f"radial-gradient(circle {radius:.2f}% at {cx:.2f}% {cy:.2f}%, {', '.join(stops)})"
        return f"radial-gradient(circle, {', '.join(stops)})"
    # DrawingML angles use 0deg from right to left and increase clockwise
    # in the slide coordinate system. CSS uses 0deg from bottom to top.
    angle = (270.0 - float(fill.gradient_angle or 0.0)) % 360.0
    return f"linear-gradient({angle:.1f}deg, {', '.join(stops)})"

_css_gradient_fill.__module__ = 'pptx2html.renderer.html_renderer'
_css_gradient_fill.__qualname__ = 'HtmlRenderer._css_gradient_fill'
