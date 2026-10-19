# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_theme_format_styles
from __future__ import annotations
from doe_export.ir.importer.shared import Border, Fill, PomPresentation, RELATIONSHIP_TYPE, Shadow

def _load_theme_format_styles(
    self, pom: PomPresentation
) -> tuple[list[Fill], list[Fill], list[Border], list[Shadow]]:
    theme_parts = []
    theme_parts.extend(
        pom.presentation_part.related_parts(RELATIONSHIP_TYPE.THEME)
    )
    for master in pom.slide_masters:
        theme_parts.extend(master.related_parts(RELATIONSHIP_TYPE.THEME))

    fills: list[Fill] = []
    bg_fills: list[Fill] = []
    lines: list[Border] = []
    effects: list[Shadow] = []
    for theme_part in theme_parts:
        if not hasattr(theme_part, "element"):
            continue
        parsed_fills, parsed_bg_fills, parsed_lines, parsed_effects = self._parse_theme_format_styles(theme_part.element)
        if parsed_fills:
            fills = parsed_fills
        if parsed_bg_fills:
            bg_fills = parsed_bg_fills
        if parsed_lines:
            lines = parsed_lines
        if parsed_effects:
            effects = parsed_effects
    return fills, bg_fills, lines, effects

_load_theme_format_styles.__module__ = 'pptx2html.ir.builder'
_load_theme_format_styles.__qualname__ = 'PresentationBuilder._load_theme_format_styles'
