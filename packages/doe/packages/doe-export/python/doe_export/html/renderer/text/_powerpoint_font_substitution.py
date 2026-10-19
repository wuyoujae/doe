# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._powerpoint_font_substitution
from __future__ import annotations

def _powerpoint_font_substitution(self, family: str) -> str:
    if family.strip().lower() in self._embedded_font_families:
        return family
    cjk = {
        "华康俪金黑W8": "SimSun",
    }
    if family in cjk:
        return cjk[family]
    lowered = family.lower()
    canva_latin = {
        "open sauce",
        "open sauce bold",
        "akzidenz-grotesk",
        "akzidenz-grotesk bold",
        "akzidenz-grotesk heavy",
    }
    if lowered in canva_latin:
        return "Courier New"
    return family

_powerpoint_font_substitution.__module__ = 'pptx2html.renderer.html_renderer'
_powerpoint_font_substitution.__qualname__ = 'HtmlRenderer._powerpoint_font_substitution'
