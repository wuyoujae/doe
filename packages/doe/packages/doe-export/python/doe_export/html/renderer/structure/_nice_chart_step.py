# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._nice_chart_step
from __future__ import annotations
from doe_export.html.renderer.shared import math

@staticmethod
def _nice_chart_step(span: float) -> float:
    rough = max(0.000001, span) / 4.0
    base = 10 ** math.floor(math.log10(rough))
    for factor in (1.0, 2.0, 2.5, 5.0, 10.0):
        step = base * factor
        if rough <= step:
            return step
    return base * 10.0

_nice_chart_step.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_nice_chart_step.__func__.__qualname__ = 'HtmlRenderer._nice_chart_step'
