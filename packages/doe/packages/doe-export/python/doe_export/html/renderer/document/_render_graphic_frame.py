# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_graphic_frame
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_graphic_frame(self, shape: Shape, base_style: list[str]) -> str:
    if shape.table:
        return self._render_table(shape, base_style)
    if shape.has_chart:
        return self._render_chart(shape, base_style)
    return self._render_auto_shape(shape, base_style)

_render_graphic_frame.__module__ = 'pptx2html.renderer.html_renderer'
_render_graphic_frame.__qualname__ = 'HtmlRenderer._render_graphic_frame'
