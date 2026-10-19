# Origin: pptx2html/htmlir/compiler.py::_iter_indexed_ir_shapes
from __future__ import annotations
from doe_export.html.compiler.shared import Shape

def _iter_indexed_ir_shapes(
    shapes: list[Shape],
    parent_key: int | None = None,
    counter: list[int] | None = None,
):
    state = counter if counter is not None else [0]
    for shape in shapes:
        shape_key = state[0]
        state[0] += 1
        yield shape_key, shape, parent_key
        yield from _iter_indexed_ir_shapes(
            shape.shapes or [],
            shape_key,
            state,
        )

_iter_indexed_ir_shapes.__module__ = 'pptx2html.htmlir.compiler'
