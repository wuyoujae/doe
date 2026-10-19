# Origin: pptx2html/htmlir/compiler.py::_text_decoration_thickness_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _text_decoration_thickness_pt(computed: dict[str, Any], font_size_pt: float) -> float | None:
    raw = str(computed.get("textDecorationThickness") or "").strip().lower()
    if not raw or raw in {"auto", "from-font", "normal"}:
        return None
    if raw.endswith("%"):
        try:
            return round(max(0.25, font_size_pt * float(raw[:-1]) / 100.0), 3)
        except ValueError:
            return None
    px = _css_px(raw)
    if px <= 0:
        return None
    font_size_px = _css_px(computed.get("fontSize")) or 16.0
    return round(max(0.25, px * font_size_pt / font_size_px), 3)

_text_decoration_thickness_pt.__module__ = 'pptx2html.htmlir.compiler'
