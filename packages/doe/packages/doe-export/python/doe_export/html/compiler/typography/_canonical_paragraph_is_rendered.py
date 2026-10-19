# Origin: pptx2html/htmlir/compiler.py::_canonical_paragraph_is_rendered
from __future__ import annotations
from doe_export.html.compiler.shared import Paragraph
from doe_export.html.compiler.typography._paragraph_has_semantic_text import _paragraph_has_semantic_text

def _canonical_paragraph_is_rendered(paragraph: Paragraph) -> bool:
    bullet = paragraph.bullet
    if bullet is None or bullet.kind == "none":
        return True
    return _paragraph_has_semantic_text(paragraph)

_canonical_paragraph_is_rendered.__module__ = 'pptx2html.htmlir.compiler'
