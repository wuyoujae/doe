# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_dash_style
from __future__ import annotations

@staticmethod
def _css_dash_style(dash: str | None) -> str:
    if not dash or dash == "solid":
        return "solid"
    lowered = dash.lower()
    if "dot" in lowered and "dash" not in lowered:
        return "dotted"
    return "dashed"

_css_dash_style.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_css_dash_style.__func__.__qualname__ = 'HtmlRenderer._css_dash_style'
