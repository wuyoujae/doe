# Origin: pptx2html/ir/builder.py::PresentationBuilder._placeholder_sources
from __future__ import annotations
from doe_export.ir.importer.shared import BaseShape

def _placeholder_sources(self, shape: BaseShape) -> list[BaseShape]:
    """Return matching layout/master placeholder shapes for *shape*."""
    ph = shape.placeholder_shape
    if ph is None:
        return []

    sources: list[BaseShape] = []
    for part in self._placeholder_part_chain(shape):
        matched = self._find_matching_placeholder(part, ph.type, ph.idx)
        if matched is not None and matched is not shape:
            sources.append(matched)
    return sources

_placeholder_sources.__module__ = 'pptx2html.ir.builder'
_placeholder_sources.__qualname__ = 'PresentationBuilder._placeholder_sources'
