# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_text_frame
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape, Optional, PomTextFrame, TextFrame

def _build_text_frame(self, shape: BaseShape) -> Optional[TextFrame]:
    pom_tf: Optional[PomTextFrame] = shape.text_frame
    if pom_tf is None:
        return None

    return self._build_text_frame_from_element(
        shape,
        pom_tf._element,
    )

_build_text_frame.__module__ = 'pptx2html.ir.builder'
_build_text_frame.__qualname__ = 'PresentationBuilder._build_text_frame'
