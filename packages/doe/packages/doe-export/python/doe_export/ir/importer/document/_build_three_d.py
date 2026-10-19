# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_three_d
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, ThreeDInfo

def _build_three_d(self, shape: BaseShape) -> Optional[ThreeDInfo]:
    three_d = self._parse_three_d(self._shape_sp_pr(shape))
    if three_d is not None:
        return three_d
    three_d = self._three_d_from_style_ref(shape)
    if three_d is not None:
        return three_d
    for inherited_shape in self._placeholder_sources(shape):
        three_d = self._parse_three_d(self._shape_sp_pr(inherited_shape))
        if three_d is not None:
            return three_d
    return None

_build_three_d.__module__ = 'pptx2html.ir.builder'
_build_three_d.__qualname__ = 'PresentationBuilder._build_three_d'
