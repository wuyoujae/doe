# Origin: pptx2html/htmlir/compiler.py::_css_text_frame_overflow
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_text_frame_overflow(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"hidden", "clip", "scroll", "auto"}:
        return "clip"
    return "overflow"

_css_text_frame_overflow.__module__ = 'pptx2html.htmlir.compiler'
