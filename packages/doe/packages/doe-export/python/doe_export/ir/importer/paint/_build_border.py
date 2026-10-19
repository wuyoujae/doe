# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_border
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Border, Optional

def _build_border(self, shape: BaseShape) -> Optional[Border]:
    sp_pr = self._shape_sp_pr(shape)
    border = self._parse_border(sp_pr)
    if border is not None:
        if not self._line_has_no_fill(sp_pr):
            self._merge_border_style(border, self._border_from_style_ref(shape))
        self._apply_default_border_width(border)
        return border

    border = self._border_from_style_ref(shape)
    if border is not None:
        self._apply_default_border_width(border)
        return border

    for inherited_shape in self._placeholder_sources(shape):
        border = self._parse_border(self._shape_sp_pr(inherited_shape))
        if border is not None:
            self._apply_default_border_width(border)
            return border

    return None

_build_border.__module__ = 'pptx2html.ir.builder'
_build_border.__qualname__ = 'PresentationBuilder._build_border'
