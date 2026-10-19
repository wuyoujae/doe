# Origin: pptx2html/htmlir/compiler.py::_canonical_source_requires_dom_validation
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.structure._iter_ir_shapes import _iter_ir_shapes

def _canonical_source_requires_dom_validation(
    source: str,
    embedded: tuple[Presentation, int] | None,
) -> bool:
    if embedded is None:
        return True
    presentation, _ = embedded
    ir_shape_count = sum(
        1
        for slide in presentation.slides
        for _shape in _iter_ir_shapes(slide.shapes)
    )
    class_shape_count = len(
        re.findall(
            r"\bclass\s*=\s*(['\"])[^'\"]*\bpptx-shape\b[^'\"]*\1",
            source,
            re.IGNORECASE,
        )
    )
    semantic_element_count = len(
        re.findall(r"\belement-type\s*=\s*(['\"])[^'\"]+\1", source, re.IGNORECASE)
    )
    return max(class_shape_count, semantic_element_count) != ir_shape_count

_canonical_source_requires_dom_validation.__module__ = 'pptx2html.htmlir.compiler'
