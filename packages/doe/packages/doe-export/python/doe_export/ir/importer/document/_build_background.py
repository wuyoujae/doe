# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_background
from __future__ import annotations
from doe_export.ir.importer.shared import Background, BaseSlidePart, Optional

def _build_background(self, slide_part: BaseSlidePart) -> Optional[Background]:
    for part in self._background_inheritance_chain(slide_part):
        previous_owner = self._active_color_owner
        self._active_color_owner = part
        try:
            fill_container = self._find_background_fill_container(part)
            fill = self._parse_fill(fill_container, part)
            if fill is None:
                fill = self._background_fill_from_ref(part)
            if fill is not None:
                return Background(fill=fill)
        finally:
            self._active_color_owner = previous_owner
    return None

_build_background.__module__ = 'pptx2html.ir.builder'
_build_background.__qualname__ = 'PresentationBuilder._build_background'
