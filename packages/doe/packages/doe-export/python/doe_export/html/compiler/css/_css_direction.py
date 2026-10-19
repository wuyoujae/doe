# Origin: pptx2html/htmlir/compiler.py::_css_direction
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_direction(computed: dict[str, Any]) -> str | None:
    raw = str(computed.get("direction") or "").strip().lower()
    if raw in {"rtl", "ltr"}:
        return raw
    return None

_css_direction.__module__ = 'pptx2html.htmlir.compiler'
