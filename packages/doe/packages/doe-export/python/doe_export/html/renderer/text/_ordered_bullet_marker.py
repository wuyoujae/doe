# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._ordered_bullet_marker
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

@staticmethod
def _ordered_bullet_marker(index: int, scheme: Optional[str]) -> str:
    from pptx2html.renderer.html_renderer import HtmlRenderer
    if scheme == "alphaLcPeriod":
        return HtmlRenderer._alpha_marker(index).lower()
    if scheme == "alphaUcPeriod":
        return HtmlRenderer._alpha_marker(index).upper()
    if scheme == "romanLcPeriod":
        return HtmlRenderer._roman_marker(index).lower()
    if scheme == "romanUcPeriod":
        return HtmlRenderer._roman_marker(index).upper()
    return str(index)

_ordered_bullet_marker.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_ordered_bullet_marker.__func__.__qualname__ = 'HtmlRenderer._ordered_bullet_marker'
