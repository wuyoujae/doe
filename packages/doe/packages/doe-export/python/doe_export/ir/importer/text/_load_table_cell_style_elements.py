# Origin: pptx2html/ir/builder.py::PresentationBuilder._load_table_cell_style_elements
from __future__ import annotations
from doe_export.ir.importer.shared import ET, PomPresentation, RELATIONSHIP_TYPE

def _load_table_cell_style_elements(
    self,
    pom: PomPresentation,
) -> dict[str, dict[str, ET.Element]]:
    styles: dict[str, dict[str, ET.Element]] = {}
    for part in pom.presentation_part.related_parts(RELATIONSHIP_TYPE.TABLE_STYLES):
        element = getattr(part, "element", None)
        if element is None:
            continue
        styles.update(self._parse_table_cell_style_elements(element))
    return styles

_load_table_cell_style_elements.__module__ = 'pptx2html.ir.builder'
_load_table_cell_style_elements.__qualname__ = 'PresentationBuilder._load_table_cell_style_elements'
