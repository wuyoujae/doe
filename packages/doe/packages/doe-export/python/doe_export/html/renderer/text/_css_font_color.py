# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_font_color
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

def _css_font_color(self, font) -> Optional[str]:
    color = self._css_color(getattr(font, "color", None))
    if not color:
        return None
    alpha = getattr(font, "alpha", None)
    if alpha is None or alpha >= 1:
        return color
    raw = color.lstrip("#")
    try:
        r = int(raw[0:2], 16)
        g = int(raw[2:4], 16)
        b = int(raw[4:6], 16)
        a = max(0.0, min(1.0, float(alpha)))
    except (TypeError, ValueError):
        return color
    return f"rgba({r},{g},{b},{a:.3f})"

_css_font_color.__module__ = 'pptx2html.renderer.html_renderer'
_css_font_color.__qualname__ = 'HtmlRenderer._css_font_color'
