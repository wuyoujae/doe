# Origin: pptx2html/htmlir/compiler.py::_css_clear_value
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_clear_value(computed: dict[str, Any]) -> str:
    raw = str(computed.get("clear") or "none").strip().lower()
    if raw in {"left", "right", "both"}:
        return raw
    if raw in {"inline-start", "inline-end"}:
        rtl = str(computed.get("direction") or "").strip().lower() == "rtl"
        return "right" if (raw == "inline-start") == rtl else "left"
    return "none"

_css_clear_value.__module__ = 'pptx2html.htmlir.compiler'
