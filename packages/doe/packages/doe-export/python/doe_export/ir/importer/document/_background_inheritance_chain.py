# Origin: pptx2html/ir/builder.py::PresentationBuilder._background_inheritance_chain
from __future__ import annotations
from doe_export.ir.importer.shared import BaseSlidePart

@staticmethod
def _background_inheritance_chain(slide_part: BaseSlidePart) -> list[BaseSlidePart]:
    chain = [slide_part]
    layout = getattr(slide_part, "slide_layout", None)
    if layout is not None:
        chain.append(layout)
        master = getattr(layout, "slide_master", None)
        if master is not None:
            chain.append(master)
    return chain

_background_inheritance_chain.__func__.__module__ = 'pptx2html.ir.builder'
_background_inheritance_chain.__func__.__qualname__ = 'PresentationBuilder._background_inheritance_chain'
