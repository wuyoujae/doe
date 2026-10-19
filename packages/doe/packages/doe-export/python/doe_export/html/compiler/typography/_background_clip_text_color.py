# Origin: pptx2html/htmlir/compiler.py::_background_clip_text_color
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.assets._background_image_fill import _background_image_fill
from doe_export.html.compiler.typography._uses_background_clip_text import _uses_background_clip_text

def _background_clip_text_color(computed: dict[str, Any]) -> tuple[str, float] | None:
    if not _uses_background_clip_text(computed):
        return None
    fill = _background_image_fill(computed, 1.0)
    if fill is None:
        return None
    if fill.type == "solid" and fill.color:
        return fill.color, fill.alpha if fill.alpha is not None else 1.0
    if fill.type == "gradient" and fill.gradient_stops:
        stop = fill.gradient_stops[len(fill.gradient_stops) // 2]
        if stop.color:
            return stop.color, stop.alpha if stop.alpha is not None else 1.0
    return None

_background_clip_text_color.__module__ = 'pptx2html.htmlir.compiler'
