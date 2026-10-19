# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._alpha_marker
from __future__ import annotations

@staticmethod
def _alpha_marker(index: int) -> str:
    value = max(1, int(index))
    result = ""
    while value:
        value -= 1
        result = chr(ord("A") + (value % 26)) + result
        value //= 26
    return result

_alpha_marker.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_alpha_marker.__func__.__qualname__ = 'HtmlRenderer._alpha_marker'
