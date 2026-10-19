# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_group
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_group(self, shape: Shape, base_style: list[str]) -> str:
    children = "\n".join(
        self._render_shape(child) for child in (shape.shapes or [])
    )
    return (
        f'<div class="pptx-shape pptx-group" '
        f'style="{self._html_style(base_style)}">\n'
        f'{children}\n'
        f'</div>'
    )

_render_group.__module__ = 'pptx2html.renderer.html_renderer'
_render_group.__qualname__ = 'HtmlRenderer._render_group'
