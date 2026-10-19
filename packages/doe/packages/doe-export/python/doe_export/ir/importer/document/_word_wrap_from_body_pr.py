# Origin: pptx2html/ir/builder.py::PresentationBuilder._word_wrap_from_body_pr
from __future__ import annotations
from doe_export.ir.importer.shared import ET, Optional

@staticmethod
def _word_wrap_from_body_pr(body_pr: Optional[ET.Element]) -> bool:
    if body_pr is None:
        return True
    return body_pr.get("wrap") != "none"

_word_wrap_from_body_pr.__func__.__module__ = 'pptx2html.ir.builder'
_word_wrap_from_body_pr.__func__.__qualname__ = 'PresentationBuilder._word_wrap_from_body_pr'
