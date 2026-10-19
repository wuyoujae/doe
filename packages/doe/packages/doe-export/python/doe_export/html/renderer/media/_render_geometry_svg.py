# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_geometry_svg
from __future__ import annotations
from doe_export.html.renderer.shared import Shape, html

def _render_geometry_svg(self, shape: Shape) -> str:
    token = self._next_svg_token(shape)
    fill, fill_defs = self._svg_fill_paint(shape.fill, token, shape.bounds)

    stroke = "none"
    stroke_width = 0.0
    if shape.border and shape.border.width:
        stroke = self._css_border_color(shape.border) or "#666666"
        stroke_width = shape.border.width
    elif shape.type == "connector":
        stroke = "#666666"
        stroke_width = 1.0

    paths = []
    marker_defs, marker_attrs = self._svg_marker_paint(shape.border, stroke, token)
    stroke_attrs = self._svg_stroke_attrs(shape.border) + marker_attrs
    for path in shape.geometry_paths:
        path_fill = "none" if path.fill == "none" else fill
        path_stroke = stroke if path.stroke else "none"
        paths.append(
            '<path '
            f'd="{html.escape(path.d, quote=True)}" '
            f'fill="{path_fill}" '
            f'stroke="{path_stroke}" '
            f'stroke-width="{stroke_width:.3f}" '
            f'{stroke_attrs}'
            'vector-effect="non-scaling-stroke"/>'
        )
    return (
        '<svg class="pptx-geometry-svg" viewBox="0 0 100 100" '
        'preserveAspectRatio="none" aria-hidden="true">'
        + fill_defs
        + marker_defs
        + "".join(paths)
        + "</svg>"
    )

_render_geometry_svg.__module__ = 'pptx2html.renderer.html_renderer'
_render_geometry_svg.__qualname__ = 'HtmlRenderer._render_geometry_svg'
