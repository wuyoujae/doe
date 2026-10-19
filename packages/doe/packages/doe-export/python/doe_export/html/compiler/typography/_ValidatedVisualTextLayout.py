# Origin: pptx2html/htmlir/compiler.py::_ValidatedVisualTextLayout
from __future__ import annotations
from doe_export.html.compiler.shared import dataclass

@dataclass(frozen=True)
class _ValidatedVisualTextLayout:
    source_text: str
    authored_break_offsets: tuple[int, ...]
    soft_break_offsets: tuple[int, ...]

_ValidatedVisualTextLayout.__module__ = 'pptx2html.htmlir.compiler'
