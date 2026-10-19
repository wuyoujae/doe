# Origin: pptx2html/htmlir/compiler.py::_normalize_viewport
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import DEFAULT_VIEWPORT

def _normalize_viewport(viewport: tuple[int, int] | list[int] | Any) -> tuple[int, int]:
    try:
        width = int(viewport[0])
        height = int(viewport[1])
    except Exception:
        width, height = DEFAULT_VIEWPORT
    return max(320, min(width, 4096)), max(180, min(height, 4096))

_normalize_viewport.__module__ = 'pptx2html.htmlir.compiler'
