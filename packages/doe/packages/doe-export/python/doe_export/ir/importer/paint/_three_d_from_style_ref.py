# Origin: pptx2html/ir/builder.py::PresentationBuilder._three_d_from_style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, ThreeDInfo, copy

def _three_d_from_style_ref(self, shape: BaseShape) -> Optional[ThreeDInfo]:
    ref = self._style_ref(shape, "effectRef")
    if ref is None or ref.get("idx") == "0":
        return None
    try:
        idx = int(ref.get("idx") or "0") - 1
    except ValueError:
        return None
    if 0 <= idx < len(self._theme_three_d_styles):
        style = self._theme_three_d_styles[idx]
        return copy.deepcopy(style) if style is not None else None
    return None

_three_d_from_style_ref.__module__ = 'pptx2html.ir.builder'
_three_d_from_style_ref.__qualname__ = 'PresentationBuilder._three_d_from_style_ref'
