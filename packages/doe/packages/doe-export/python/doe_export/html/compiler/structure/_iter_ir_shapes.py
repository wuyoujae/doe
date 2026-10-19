# Origin: pptx2html/htmlir/compiler.py::_iter_ir_shapes
from __future__ import annotations
from doe_export.html.compiler.shared import Shape

def _iter_ir_shapes(shapes: list[Shape]):
    for shape in shapes:
        yield shape
        yield from _iter_ir_shapes(shape.shapes or [])

_iter_ir_shapes.__module__ = 'pptx2html.htmlir.compiler'
