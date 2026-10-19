# Origin: pptx2html/ir/builder.py::PresentationBuilder._shadow_from_style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, Shadow, copy

def _shadow_from_style_ref(self, shape: BaseShape) -> Optional[Shadow]:
    ref = self._style_ref(shape, "effectRef")
    if ref is None or ref.get("idx") == "0":
        return None
    style = self._theme_style_by_idx(self._theme_effect_styles, ref.get("idx"))
    if style is None:
        return None
    styled = copy.deepcopy(style)
    color, alpha = self._color_from_fill_elem(ref)
    if color:
        styled.color = color
    if alpha is not None:
        styled.alpha = alpha
    return styled

_shadow_from_style_ref.__module__ = 'pptx2html.ir.builder'
_shadow_from_style_ref.__qualname__ = 'PresentationBuilder._shadow_from_style_ref'
