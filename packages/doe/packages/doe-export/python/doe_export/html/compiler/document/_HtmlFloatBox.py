# Origin: pptx2html/htmlir/compiler.py::_HtmlFloatBox
from __future__ import annotations
from doe_export.html.compiler.shared import dataclass

@dataclass(frozen=True)
class _HtmlFloatBox:
    path: str
    side: str
    bounds: Bounds

_HtmlFloatBox.__module__ = 'pptx2html.htmlir.compiler'
