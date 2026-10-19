# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._background_position_percent
from __future__ import annotations

@staticmethod
def _background_position_percent(offset: float, size: float) -> float:
    denominator = 1.0 - size
    if abs(denominator) < 1e-9:
        return 0.0
    return offset / denominator * 100.0

_background_position_percent.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_background_position_percent.__func__.__qualname__ = 'HtmlRenderer._background_position_percent'
