# Origin: pptx2html/ir/builder.py::PresentationBuilder._resolve_color
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, normalize_hex_color

def _resolve_color(self, value: Optional[str]) -> Optional[str]:
    color = normalize_hex_color(value)
    if color:
        return color
    if value:
        key = value.lower()
        palette = self._theme_colors_for_owner(self._active_color_owner)
        mapped = self._effective_color_map(self._active_color_owner).get(key, key)
        return palette.get(mapped, palette.get(key, value))
    return None

_resolve_color.__module__ = 'pptx2html.ir.builder'
_resolve_color.__qualname__ = 'PresentationBuilder._resolve_color'
