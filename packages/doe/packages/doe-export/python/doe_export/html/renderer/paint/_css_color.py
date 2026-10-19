# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_color
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, normalize_hex_color

@staticmethod
def _css_color(color: Optional[str]) -> Optional[str]:
    normalized = normalize_hex_color(color)
    if normalized:
        return f"#{normalized}"
    return None

_css_color.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_css_color.__func__.__qualname__ = 'HtmlRenderer._css_color'
