# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_slide
from __future__ import annotations
from doe_export.ir.importer.shared import IRSlide, SlidePart

def _build_slide(self, slide_part: SlidePart, index: int) -> IRSlide:
    ir = IRSlide(
        index=index,
        name=slide_part.name,
        show=slide_part.show,
        background=self._build_background(slide_part),
        transition=self._build_slide_transition(slide_part),
        animations=self._build_slide_animations(slide_part),
    )
    for shape in self._inherited_render_shapes(slide_part):
        ir_shape = self._build_shape(shape)
        if ir_shape is not None:
            self._mark_shape_source_scope(
                ir_shape,
                self._inherited_shape_source_scope(shape, slide_part),
            )
            ir.shapes.append(ir_shape)
    for shape in slide_part.shapes:
        ir_shape = self._build_shape(shape)
        if ir_shape is not None:
            self._mark_shape_source_scope(ir_shape, "slide")
            ir.shapes.append(ir_shape)
    return ir

_build_slide.__module__ = 'pptx2html.ir.builder'
_build_slide.__qualname__ = 'PresentationBuilder._build_slide'
