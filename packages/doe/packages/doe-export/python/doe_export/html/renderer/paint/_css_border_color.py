# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_border_color
from __future__ import annotations
from doe_export.html.renderer.shared import Border, Optional

def _css_border_color(self, border: Border | None) -> Optional[str]:
    if border is None:
        return None
    color = self._css_color(border.color)
    if not color:
        return None
    alpha = getattr(border, "alpha", None)
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

_css_border_color.__module__ = 'pptx2html.renderer.html_renderer'
_css_border_color.__qualname__ = 'HtmlRenderer._css_border_color'
