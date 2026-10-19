# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_shape
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_shape(self, shape: Shape) -> str:
    style = self._shape_style(shape)

    if shape.type == "auto_shape":
        return self._render_auto_shape(shape, style)
    elif shape.type == "picture":
        return self._render_picture(shape, style)
    elif shape.type == "group_shape":
        return self._render_group(shape, style)
    elif shape.type == "graphic_frame":
        return self._render_graphic_frame(shape, style)
    elif shape.type == "connector":
        return self._render_connector(shape, style)
    else:
        return self._render_auto_shape(shape, style)

_render_shape.__module__ = 'pptx2html.renderer.html_renderer'
_render_shape.__qualname__ = 'HtmlRenderer._render_shape'
