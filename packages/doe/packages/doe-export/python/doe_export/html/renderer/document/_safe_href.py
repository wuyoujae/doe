# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._safe_href
from __future__ import annotations
from doe_export.html.renderer.shared import Optional, html

@staticmethod
def _safe_href(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    lowered = value.strip().lower()
    if lowered.startswith(("http://", "https://", "mailto:", "#")):
        return html.escape(value.strip(), quote=True)
    return None

_safe_href.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_safe_href.__func__.__qualname__ = 'HtmlRenderer._safe_href'
