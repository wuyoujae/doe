# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._finite_float
from __future__ import annotations
from doe_export.html.renderer.shared import math

@staticmethod
def _finite_float(value) -> float:
    try:
        result = float(value or 0.0)
    except (TypeError, ValueError):
        return 0.0
    return result if math.isfinite(result) else 0.0

_finite_float.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_finite_float.__func__.__qualname__ = 'HtmlRenderer._finite_float'
