# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._html_style
from __future__ import annotations
from doe_export.html.renderer.shared import html

@staticmethod
def _html_style(styles: list[str]) -> str:
    """Serialize CSS declarations safely inside a double-quoted attribute."""

    return html.escape("; ".join(styles), quote=True)

_html_style.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_html_style.__func__.__qualname__ = 'HtmlRenderer._html_style'
