# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._svg_fill_paint
from __future__ import annotations
from doe_export.html.renderer.shared import Fill

def _svg_fill_paint(
    self,
    fill: Fill | None,
    token: str,
    bounds=None,
) -> tuple[str, str]:
    if fill is None or fill.type == "none":
        return "none", ""
    if fill.type == "solid":
        color = self._css_color(fill.color) or "none"
        if color != "none" and fill.alpha is not None and fill.alpha < 1.0:
            raw = color.lstrip("#")
            color = (
                f"rgba({int(raw[0:2], 16)},{int(raw[2:4], 16)},"
                f"{int(raw[4:6], 16)},{max(0.0, min(1.0, fill.alpha)):.3f})"
            )
        return color, ""
    if fill.type == "gradient" and fill.gradient_stops:
        gradient_id = f"{token}-gradient"
        stops = []
        for stop in fill.gradient_stops:
            color = self._css_color(stop.color)
            if not color:
                continue
            opacity = ""
            if stop.alpha is not None:
                opacity = f' stop-opacity="{max(0.0, min(1.0, stop.alpha)):.4f}"'
            position = max(0.0, min(1.0, stop.position or 0.0))
            stops.append(f'<stop offset="{position:.6f}" stop-color="{color}"{opacity}/>')
        if not stops:
            return "none", ""
        if fill.gradient_path and fill.gradient_path != "none":
            left = fill.gradient_fill_to_left
            right = fill.gradient_fill_to_right
            top = fill.gradient_fill_to_top
            bottom = fill.gradient_fill_to_bottom
            values = (left, right, top, bottom)
            valid_rect = all(value is not None and 0 <= value <= 1 for value in values)
            cx = (((left or 0) + (1 - (right or 0))) * 50) if valid_rect else 50
            cy = (((top or 0) + (1 - (bottom or 0))) * 50) if valid_rect else 50
            radius = (
                max(1.0, (1 - (left or 0) - (right or 0)) * 50, (1 - (top or 0) - (bottom or 0)) * 50)
                if valid_rect
                else 70.711
            )
            element = (
                f'<radialGradient id="{gradient_id}" gradientUnits="userSpaceOnUse" '
                f'cx="{cx:.6f}" cy="{cy:.6f}" r="{radius:.6f}">'
                f'{"".join(stops)}</radialGradient>'
            )
        else:
            # SVG's linear-gradient vector starts left-to-right at 0deg;
            # convert from DrawingML's opposite horizontal axis.
            angle = (180.0 - float(fill.gradient_angle or 0.0)) % 360.0
            element = (
                f'<linearGradient id="{gradient_id}" gradientUnits="userSpaceOnUse" '
                f'x1="0" y1="50" x2="100" y2="50" '
                f'gradientTransform="rotate({angle:.6f} 50 50)">'
                f'{"".join(stops)}</linearGradient>'
            )
        return f"url(#{gradient_id})", f"<defs>{element}</defs>"
    if fill.type == "picture" and fill.image:
        pattern_id = f"{token}-picture"
        element = self._image_pattern_definition(
            fill.image,
            pattern_id,
            float(getattr(bounds, "width", 0.0) or 100.0),
            float(getattr(bounds, "height", 0.0) or 100.0),
            opacity_multiplier=fill.alpha,
        )
        return f"url(#{pattern_id})", f"<defs>{element}</defs>"
    if fill.type == "pattern":
        pattern_id = f"{token}-pattern"
        foreground = self._css_color(fill.pattern_fg_color) or "#000000"
        background = self._css_color(fill.pattern_bg_color) or "#FFFFFF"
        preset = str(fill.pattern_preset or "cross").lower()
        if "diag" in preset:
            strokes = '<path d="M-2 8 L8 -2 M2 10 L10 2"/>'
        elif "horz" in preset:
            strokes = '<path d="M0 2 H8 M0 6 H8"/>'
        elif "vert" in preset:
            strokes = '<path d="M2 0 V8 M6 0 V8"/>'
        else:
            strokes = '<path d="M0 4 H8 M4 0 V8"/>'
        element = (
            f'<pattern id="{pattern_id}" patternUnits="userSpaceOnUse" width="8" height="8">'
            f'<rect width="8" height="8" fill="{background}"/>'
            f'<g fill="none" stroke="{foreground}" stroke-width="1">{strokes}</g>'
            '</pattern>'
        )
        return f"url(#{pattern_id})", f"<defs>{element}</defs>"
    return "none", ""

_svg_fill_paint.__module__ = 'pptx2html.renderer.html_renderer'
_svg_fill_paint.__qualname__ = 'HtmlRenderer._svg_fill_paint'
