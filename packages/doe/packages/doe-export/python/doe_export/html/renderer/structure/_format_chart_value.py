# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._format_chart_value
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, re

@staticmethod
def _format_chart_value(value: float, number_format: Optional[str], percent: bool) -> str:
    normalized = number_format or ""
    decimals = 1 if percent else 0
    pattern = r"0(?:\.([0#]+))?%" if percent else r"0\.([0#]+)"
    match = re.search(pattern, normalized)
    if match:
        decimals = len(match.group(1) or "")
    scaled = value * 100 if percent else value
    return f"{scaled:.{decimals}f}{'%' if percent else ''}"

_format_chart_value.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_format_chart_value.__func__.__qualname__ = 'HtmlRenderer._format_chart_value'
