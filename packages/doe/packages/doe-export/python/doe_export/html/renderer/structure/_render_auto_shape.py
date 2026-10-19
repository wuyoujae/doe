# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_auto_shape
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_auto_shape(self, shape: Shape, base_style: list[str]) -> str:
    classes = ["pptx-shape"]
    if shape.placeholder:
        classes.append("pptx-placeholder")

    inner = ""
    if shape.geometry_paths:
        inner += self._render_geometry_svg(shape)
    if shape.text:
        inner += self._render_text_frame(shape.text, shape)
    elif shape.has_chart:
        inner += self._chart_fallback(shape)

    return (
        f'<div class="{" ".join(classes)}" '
        f'style="{self._html_style(base_style)}">\n'
        f'{inner}\n'
        f'</div>'
    )

_render_auto_shape.__module__ = 'pptx2html.renderer.html_renderer'
_render_auto_shape.__qualname__ = 'HtmlRenderer._render_auto_shape'
