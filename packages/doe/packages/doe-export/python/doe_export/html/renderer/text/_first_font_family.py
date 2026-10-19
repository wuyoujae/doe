# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._first_font_family
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

@staticmethod
def _first_font_family(font, text: str) -> Optional[str]:
    from pptx2html.renderer.html_renderer import HtmlRenderer
    if font is None:
        return None
    if HtmlRenderer._contains_cjk(text):
        return font.ea_family or font.family or font.latin_family or font.cs_family or font.sym_family
    return font.latin_family or font.family or font.ea_family or font.cs_family or font.sym_family

_first_font_family.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_first_font_family.__func__.__qualname__ = 'HtmlRenderer._first_font_family'
