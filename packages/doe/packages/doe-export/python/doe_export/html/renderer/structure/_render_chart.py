# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._render_chart
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

def _render_chart(self, shape: Shape, base_style: list[str]) -> str:
    return (
        f'<div class="pptx-shape pptx-chart" '
        f'style="{self._html_style(base_style)}">\n'
        f'{self._chart_fallback(shape)}\n'
        f'</div>'
    )

_render_chart.__module__ = 'pptx2html.renderer.html_renderer'
_render_chart.__qualname__ = 'HtmlRenderer._render_chart'
