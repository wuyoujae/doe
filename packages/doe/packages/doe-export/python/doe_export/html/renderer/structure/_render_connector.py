# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_connector
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_connector(self, shape: Shape, base_style: list[str]) -> str:
    if shape.geometry_paths:
        return (
            f'<div class="pptx-shape pptx-connector" '
            f'style="{self._html_style(base_style)}">\n'
            f'{self._render_geometry_svg(shape)}\n'
            '</div>'
        )

    stroke = "#666666"
    stroke_width = 1.0
    if shape.border:
        stroke = self._css_border_color(shape.border) or stroke
        stroke_width = shape.border.width or stroke_width
    token = self._next_svg_token(shape)
    marker_defs, marker_attrs = self._svg_marker_paint(shape.border, stroke, token)
    stroke_attrs = self._svg_stroke_attrs(shape.border) + marker_attrs

    if (shape.connector_type or "").lower().startswith("bent"):
        line = (
            f'<polyline points="0,0 100,0 100,100" '
            f'fill="none" stroke="{stroke}" stroke-width="{stroke_width:.2f}" '
            f'{stroke_attrs}'
            'vector-effect="non-scaling-stroke"/>'
        )
    else:
        line = (
            f'<line x1="0" y1="0" x2="100" y2="100" '
            f'stroke="{stroke}" stroke-width="{stroke_width:.2f}" '
            f'{stroke_attrs}'
            'vector-effect="non-scaling-stroke"/>'
        )

    return (
        f'<div class="pptx-shape pptx-connector" '
        f'style="{self._html_style(base_style)}">\n'
        '<svg viewBox="0 0 100 100" preserveAspectRatio="none" '
        'aria-hidden="true">\n'
        f'{marker_defs}'
        f'{line}\n'
        '</svg>\n'
        '</div>'
    )

_render_connector.__module__ = 'pptx2html.renderer.html_renderer'
_render_connector.__qualname__ = 'HtmlRenderer._render_connector'
