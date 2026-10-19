# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._css_font_stack
from __future__ import annotations

def _css_font_stack(self, font, text: str) -> str:
    families = []
    if self._contains_cjk(text):
        families.extend([font.ea_family, font.family, font.latin_family, font.cs_family, font.sym_family])
        families.extend(["SimSun", "Microsoft YaHei", "Noto Sans CJK SC"])
    else:
        families.extend([font.latin_family, font.family, font.ea_family, font.cs_family, font.sym_family])
        families.extend(["SimSun", "Times New Roman", "Aptos", "Arial"])

    cleaned = []
    seen = set()
    for family in families:
        if not family or str(family).startswith("+"):
            continue
        name = self._powerpoint_font_substitution(str(family))
        if name in seen:
            continue
        seen.add(name)
        cleaned.append('"' + name.replace("\\", "\\\\").replace('"', '\\"') + '"')
    cleaned.append("sans-serif")
    return ", ".join(cleaned)

_css_font_stack.__module__ = 'pptx2html.renderer.html_renderer'
_css_font_stack.__qualname__ = 'HtmlRenderer._css_font_stack'
