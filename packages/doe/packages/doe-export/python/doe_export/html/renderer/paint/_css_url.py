# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_url
from __future__ import annotations

@staticmethod
def _css_url(value: str) -> str:
    return str(value or "").replace("\\", "\\\\").replace("'", "\\'")

_css_url.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_css_url.__func__.__qualname__ = 'HtmlRenderer._css_url'
