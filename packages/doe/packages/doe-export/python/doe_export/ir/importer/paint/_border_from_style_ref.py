# Origin: pptx2html/ir/builder.py::PresentationBuilder._border_from_style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Border, Optional, copy

def _border_from_style_ref(self, shape: BaseShape) -> Optional[Border]:
    ref = self._style_ref(shape, "lnRef")
    if ref is None or ref.get("idx") == "0":
        return None
    color, _ = self._color_from_fill_elem(ref)
    style = self._theme_style_by_idx(self._theme_line_styles, ref.get("idx"))
    if style is not None:
        styled = copy.deepcopy(style)
        if color:
            styled.color = color
        if styled.width is None:
            styled.width = 1.0
        return styled
    return Border(width=1.0, color=color) if color else None

_border_from_style_ref.__module__ = 'pptx2html.ir.builder'
_border_from_style_ref.__qualname__ = 'PresentationBuilder._border_from_style_ref'
