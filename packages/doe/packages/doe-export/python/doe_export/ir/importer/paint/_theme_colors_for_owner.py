# Origin: pptx2html/ir/builder.py::PresentationBuilder._theme_colors_for_owner
from __future__ import annotations
from doe_export.ir.importer.shared import RELATIONSHIP_TYPE

def _theme_colors_for_owner(self, owner: object | None) -> dict[str, str]:
    cache_key = self._owner_cache_key(owner)
    if cache_key is None:
        return self._theme_colors
    cached = self._theme_colors_by_owner.get(cache_key)
    if cached is not None:
        return cached

    colors: dict[str, str] = {}
    found_theme = False
    for part in reversed(self._owner_part_chain(owner)):
        for rel_type in (
            RELATIONSHIP_TYPE.THEME,
            RELATIONSHIP_TYPE.THEME_OVERRIDE,
        ):
            for theme_part in self._related_parts_for_type(part, rel_type):
                theme_element = getattr(theme_part, "element", None)
                if theme_element is None:
                    continue
                parsed = self._parse_theme_colors(theme_element)
                if parsed:
                    colors.update(parsed)
                    found_theme = True

    if not found_theme:
        colors.update(self._theme_colors)
    self._theme_colors_by_owner[cache_key] = colors
    return colors

_theme_colors_for_owner.__module__ = 'pptx2html.ir.builder'
_theme_colors_for_owner.__qualname__ = 'PresentationBuilder._theme_colors_for_owner'
