# Origin: pptx2html/ir/builder.py::PresentationBuilder._show_master_shapes
from __future__ import annotations
from doe_export.ir.importer.shared import SlidePart

@staticmethod
def _show_master_shapes(slide_part: SlidePart) -> bool:
    return slide_part.element.get("showMasterSp") != "0"

_show_master_shapes.__func__.__module__ = 'pptx2html.ir.builder'
_show_master_shapes.__func__.__qualname__ = 'PresentationBuilder._show_master_shapes'
