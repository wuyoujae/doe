# Origin: pptx2html/ir/builder.py::PresentationBuilder._fill_from_style_ref
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Fill, Optional

def _fill_from_style_ref(self, shape: BaseShape) -> Optional[Fill]:
    ref = self._style_ref(shape, "fillRef")
    if ref is None or ref.get("idx") == "0":
        return None
    fill = self._fill_from_theme_matrix(ref.get("idx"), ref)
    if fill is not None:
        return fill
    color, alpha = self._color_from_fill_elem(ref)
    return Fill(type="solid", color=color, alpha=alpha) if color else None

_fill_from_style_ref.__module__ = 'pptx2html.ir.builder'
_fill_from_style_ref.__qualname__ = 'PresentationBuilder._fill_from_style_ref'
