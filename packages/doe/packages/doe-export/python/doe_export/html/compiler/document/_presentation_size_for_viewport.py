# Origin: pptx2html/htmlir/compiler.py::_presentation_size_for_viewport
from __future__ import annotations
from doe_export.html.compiler.shared import CANONICAL_VIEWPORT, SLIDE_HEIGHT, SLIDE_WIDTH, math
from doe_export.html.compiler.document._normalize_viewport import _normalize_viewport

def _presentation_size_for_viewport(viewport: tuple[int, int]) -> tuple[float, float]:
    width, height = _normalize_viewport(viewport)
    if math.isclose(width / height, SLIDE_WIDTH / SLIDE_HEIGHT, rel_tol=0.0, abs_tol=1e-6):
        return (SLIDE_WIDTH, SLIDE_HEIGHT)
    scale = SLIDE_WIDTH / CANONICAL_VIEWPORT[0]
    return (round(width * scale, 3), round(height * scale, 3))

_presentation_size_for_viewport.__module__ = 'pptx2html.htmlir.compiler'
