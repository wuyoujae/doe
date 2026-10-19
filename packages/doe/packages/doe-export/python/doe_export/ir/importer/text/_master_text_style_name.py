# Origin: pptx2html/ir/builder.py::PresentationBuilder._master_text_style_name
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape

@staticmethod
def _master_text_style_name(shape: BaseShape) -> str:
    ph = shape.placeholder_shape
    ph_type = ph.type if ph is not None else None
    if ph_type in ("title", "ctrTitle"):
        return "titleStyle"
    if ph_type in ("body", "obj", "subTitle"):
        return "bodyStyle"
    return "otherStyle"

_master_text_style_name.__func__.__module__ = 'pptx2html.ir.builder'
_master_text_style_name.__func__.__qualname__ = 'PresentationBuilder._master_text_style_name'
