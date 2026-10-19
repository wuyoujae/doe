# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_table_text_styles
from __future__ import annotations
from doe_export.ir.importer.shared import PomPresentation, RELATIONSHIP_TYPE

def _load_table_text_styles(self, pom: PomPresentation) -> dict[str, dict[str, dict]]:
    styles: dict[str, dict[str, dict]] = {}
    for part in pom.presentation_part.related_parts(RELATIONSHIP_TYPE.TABLE_STYLES):
        element = getattr(part, "element", None)
        if element is None:
            continue
        styles.update(self._parse_table_text_styles(element))
    return styles

_load_table_text_styles.__module__ = 'pptx2html.ir.builder'
_load_table_text_styles.__qualname__ = 'PresentationBuilder._load_table_text_styles'
