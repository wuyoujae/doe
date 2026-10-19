# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_fill
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Fill, Optional, copy

def _build_fill(self, shape: BaseShape) -> Optional[Fill]:
    if shape._element.get("useBgFill") == "1":
        background_owner = self._active_slide_part or shape.part
        background = self._build_background(background_owner)
        return copy.deepcopy(background.fill) if background and background.fill else None

    fill = self._parse_fill(self._shape_sp_pr(shape), shape)
    if fill is not None:
        return fill

    fill = self._fill_from_style_ref(shape)
    if fill is not None:
        return fill

    for inherited_shape in self._placeholder_sources(shape):
        fill = self._parse_fill(self._shape_sp_pr(inherited_shape), inherited_shape)
        if fill is not None:
            return fill

    return None

_build_fill.__module__ = 'pptx2html.ir.builder'
_build_fill.__qualname__ = 'PresentationBuilder._build_fill'
