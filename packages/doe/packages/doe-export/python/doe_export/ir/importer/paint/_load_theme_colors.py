# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_theme_colors
from __future__ import annotations
from doe_export.ir.importer.shared import PomPresentation, RELATIONSHIP_TYPE

def _load_theme_colors(self, pom: PomPresentation) -> dict[str, str]:
    theme_parts = []
    theme_parts.extend(
        pom.presentation_part.related_parts(RELATIONSHIP_TYPE.THEME)
    )
    for master in pom.slide_masters:
        theme_parts.extend(master.related_parts(RELATIONSHIP_TYPE.THEME))

    colors: dict[str, str] = {}
    for theme_part in theme_parts:
        if not hasattr(theme_part, "element"):
            continue
        colors.update(self._parse_theme_colors(theme_part.element))
    return colors

_load_theme_colors.__module__ = 'pptx2html.ir.builder'
_load_theme_colors.__qualname__ = 'PresentationBuilder._load_theme_colors'
