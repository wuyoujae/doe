# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._chart_uses_percent
from __future__ import annotations

@staticmethod
def _chart_uses_percent(chart, numeric_series) -> bool:
    formats = " ".join(
        value
        for value in [chart.value_axis_format, *(series.value_format for series, _ in numeric_series)]
        if value
    )
    if "%" in formats:
        return True
    values = [value for _, points in numeric_series for value in points]
    return bool(values) and all(abs(value) <= 1 for value in values)

_chart_uses_percent.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_chart_uses_percent.__func__.__qualname__ = 'HtmlRenderer._chart_uses_percent'
