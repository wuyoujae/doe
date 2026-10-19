# Origin: pptx2html/htmlir/compiler.py::_paragraph_has_semantic_text
from __future__ import annotations
from doe_export.html.compiler.shared import Paragraph

def _paragraph_has_semantic_text(paragraph: Paragraph) -> bool:
    return any(
        run.kind != "break" and bool(str(run.text or "").strip())
        for run in paragraph.runs
    )

_paragraph_has_semantic_text.__module__ = 'pptx2html.htmlir.compiler'
