# Origin: pptx2html/ir/builder.py::PresentationBuilder._parse_shadow
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional, Shadow

def _parse_shadow(self, container: Optional[ET.Element]) -> Optional[Shadow]:
    return self._primary_shadow(self._parse_effects(container))

_parse_shadow.__module__ = 'pptx2html.ir.builder'
_parse_shadow.__qualname__ = 'PresentationBuilder._parse_shadow'
