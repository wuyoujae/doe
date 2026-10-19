# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_text_decoration_style
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

def _css_text_decoration_style(self, font: Font) -> Optional[str]:
    strike_style = getattr(font, "strike_style", None)
    if strike_style in {"solid", "double", "dotted", "dashed", "wavy"}:
        return strike_style
    underline = str(font.underline or "")
    if underline in {"dbl", "dblHeavy"}:
        return "double"
    if underline.startswith("dot"):
        return "dotted"
    if underline.startswith("dash"):
        return "dashed"
    if underline.startswith("wavy"):
        return "wavy"
    return None

_css_text_decoration_style.__module__ = 'pptx2html.renderer.html_renderer'
_css_text_decoration_style.__qualname__ = 'HtmlRenderer._css_text_decoration_style'
