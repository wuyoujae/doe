# Origin: pptx2html/htmlir/compiler.py::_css_vertical_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_vertical_text(computed: dict[str, Any]) -> str | None:
    writing_mode = str(computed.get("writingMode") or "").strip().lower()
    if writing_mode in {"vertical-rl", "sideways-rl"}:
        return "vert"
    if writing_mode in {"vertical-lr", "sideways-lr"}:
        return "vert270"
    return None

_css_vertical_text.__module__ = 'pptx2html.htmlir.compiler'
