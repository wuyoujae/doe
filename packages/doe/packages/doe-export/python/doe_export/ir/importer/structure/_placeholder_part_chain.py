# Origin: pptx2html/ir/builder.py::PresentationBuilder._placeholder_part_chain
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, BaseSlidePart

@staticmethod
def _placeholder_part_chain(shape: BaseShape) -> list[BaseSlidePart]:
    part = shape.part
    chain: list[BaseSlidePart] = []

    layout = getattr(part, "slide_layout", None)
    if layout is not None:
        chain.append(layout)
        master = getattr(layout, "slide_master", None)
        if master is not None:
            chain.append(master)
        return chain

    master = getattr(part, "slide_master", None)
    if master is not None:
        chain.append(master)

    return chain

_placeholder_part_chain.__func__.__module__ = 'pptx2html.ir.builder'
_placeholder_part_chain.__func__.__qualname__ = 'PresentationBuilder._placeholder_part_chain'
