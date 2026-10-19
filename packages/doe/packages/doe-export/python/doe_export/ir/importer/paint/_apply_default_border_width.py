# Origin: pptx2html/ir/builder.py::PresentationBuilder._apply_default_border_width
from __future__ import annotations
from doe_export.ir.importer.shared import Border

@staticmethod
def _apply_default_border_width(border: Border) -> None:
    if border.no_fill:
        return
    if border.width is None and border.color is not None:
        border.width = 0.75

_apply_default_border_width.__func__.__module__ = 'pptx2html.ir.builder'
_apply_default_border_width.__func__.__qualname__ = 'PresentationBuilder._apply_default_border_width'
