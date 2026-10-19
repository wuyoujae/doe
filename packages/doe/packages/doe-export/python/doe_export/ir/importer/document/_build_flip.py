# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_flip
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, parse_bool

@staticmethod
def _build_flip(shape: BaseShape, attr: str) -> bool:
    xfrm = shape._find_xfrm()
    if xfrm is None:
        return False
    return bool(parse_bool(xfrm.get(attr)))

_build_flip.__func__.__module__ = 'pptx2html.ir.builder'
_build_flip.__func__.__qualname__ = 'PresentationBuilder._build_flip'
