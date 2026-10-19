# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_shadow
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, Shadow

def _build_shadow(self, shape: BaseShape) -> Optional[Shadow]:
    return self._primary_shadow(self._build_effects(shape))

_build_shadow.__module__ = 'pptx2html.ir.builder'
_build_shadow.__qualname__ = 'PresentationBuilder._build_shadow'
