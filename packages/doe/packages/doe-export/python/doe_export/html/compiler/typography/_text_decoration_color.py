# Origin: pptx2html/htmlir/compiler.py::_text_decoration_color
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_color import _css_color

def _text_decoration_color(computed: dict[str, Any], opacity: float) -> tuple[str, float]:
    raw = computed.get("textDecorationColor") or computed.get("color")
    color = _css_color(raw)
    if color is None:
        color = _css_color(computed.get("color")) or ("000000", 1.0)
    return color[0], max(0.0, min(1.0, color[1] * opacity))

_text_decoration_color.__module__ = 'pptx2html.htmlir.compiler'
