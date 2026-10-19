# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._chart_ticks
from __future__ import annotations
from doe_export.html.renderer.shared import math

@staticmethod
def _chart_ticks(axis_min: float, axis_max: float, step: float) -> list[float]:
    safe_step = max(0.000001, step)
    value = math.ceil(axis_min / safe_step) * safe_step
    if abs(value) < safe_step / 1000:
        value = 0.0
    ticks = []
    for _ in range(40):
        if value > axis_max + safe_step / 1000:
            break
        ticks.append(round(value, 10))
        value += safe_step
    if not ticks or ticks[-1] < axis_max - safe_step / 1000:
        ticks.append(round(axis_max, 10))
    return ticks

_chart_ticks.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_chart_ticks.__func__.__qualname__ = 'HtmlRenderer._chart_ticks'
