# Origin: pptx2html/ir/builder.py::PresentationBuilder._inherited_render_shapes
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, SlidePart

def _inherited_render_shapes(self, slide_part: SlidePart) -> list[BaseShape]:
    shapes: list[BaseShape] = []
    layout = getattr(slide_part, "slide_layout", None)
    if layout is None:
        return shapes
    master = getattr(layout, "slide_master", None)
    if master is not None and self._show_master_shapes(slide_part):
        shapes.extend(self._non_placeholder_shapes(master))
    shapes.extend(self._non_placeholder_shapes(layout))
    return shapes

_inherited_render_shapes.__module__ = 'pptx2html.ir.builder'
_inherited_render_shapes.__qualname__ = 'PresentationBuilder._inherited_render_shapes'
