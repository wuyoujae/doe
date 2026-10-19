# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_theme_three_d_styles
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, PomPresentation, RELATIONSHIP_TYPE, ThreeDInfo

def _load_theme_three_d_styles(self, pom: PomPresentation) -> list[Optional[ThreeDInfo]]:
    theme_parts = []
    theme_parts.extend(
        pom.presentation_part.related_parts(RELATIONSHIP_TYPE.THEME)
    )
    for master in pom.slide_masters:
        theme_parts.extend(master.related_parts(RELATIONSHIP_TYPE.THEME))

    styles: list[Optional[ThreeDInfo]] = []
    for theme_part in theme_parts:
        if not hasattr(theme_part, "element"):
            continue
        parsed = self._parse_theme_three_d_styles(theme_part.element)
        if parsed:
            styles = parsed
    return styles

_load_theme_three_d_styles.__module__ = 'pptx2html.ir.builder'
_load_theme_three_d_styles.__qualname__ = 'PresentationBuilder._load_theme_three_d_styles'
