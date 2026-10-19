# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._next_svg_token
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _next_svg_token(self, shape: Shape) -> str:
    self._svg_counter += 1
    shape_id = getattr(shape, "shape_id", None)
    return f"pptx-svg-{self._svg_counter}-{shape_id if shape_id is not None else 'x'}"

_next_svg_token.__module__ = 'pptx2html.renderer.html_renderer'
_next_svg_token.__qualname__ = 'HtmlRenderer._next_svg_token'
