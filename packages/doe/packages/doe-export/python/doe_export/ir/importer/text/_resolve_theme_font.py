# Origin: pptx2html/ir/builder.py::PresentationBuilder._resolve_theme_font
from __future__ import annotations
from doe_export.ir.importer.shared import Optional

def _resolve_theme_font(self, typeface: Optional[str]) -> Optional[str]:
    if not typeface:
        return typeface
    alias_map = {
        "+mj-lt": "major_latin",
        "+mj-ea": "major_ea",
        "+mj-cs": "major_cs",
        "+mn-lt": "minor_latin",
        "+mn-ea": "minor_ea",
        "+mn-cs": "minor_cs",
    }
    slot = alias_map.get(typeface)
    if slot is None:
        return typeface
    return self._theme_fonts.get(slot, typeface)

_resolve_theme_font.__module__ = 'pptx2html.ir.builder'
_resolve_theme_font.__qualname__ = 'PresentationBuilder._resolve_theme_font'
