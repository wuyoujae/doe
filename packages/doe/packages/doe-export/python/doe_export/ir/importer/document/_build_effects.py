# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_effects
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Shadow

def _build_effects(self, shape: BaseShape) -> list[Shadow]:
    effects = self._parse_effects(self._shape_sp_pr(shape))
    if effects:
        return effects
    shadow = self._shadow_from_style_ref(shape)
    if shadow is not None:
        return [shadow]
    for inherited_shape in self._placeholder_sources(shape):
        effects = self._parse_effects(self._shape_sp_pr(inherited_shape))
        if effects:
            return effects
    return []

_build_effects.__module__ = 'pptx2html.ir.builder'
_build_effects.__qualname__ = 'PresentationBuilder._build_effects'
