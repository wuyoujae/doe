# Origin: pptx2html/htmlir/compiler.py::_svg_line_cap
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _svg_line_cap(value: Any) -> str | None:
    raw = str(value or "").strip().lower()
    if raw == "round":
        return "rnd"
    if raw == "square":
        return "sq"
    if raw == "butt":
        return "flat"
    return None

_svg_line_cap.__module__ = 'pptx2html.htmlir.compiler'
