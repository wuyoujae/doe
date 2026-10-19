# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._chart_placeholder
from __future__ import annotations
from doe_export.html.renderer.shared import Shape

@staticmethod
def _chart_placeholder(shape: Shape) -> str:
    return (
        '<div class="pptx-chart-placeholder" '
        'style="width:100%;height:100%;">'
        'Chart</div>'
    )

_chart_placeholder.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_chart_placeholder.__func__.__qualname__ = 'HtmlRenderer._chart_placeholder'
