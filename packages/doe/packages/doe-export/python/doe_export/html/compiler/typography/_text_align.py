# Origin: pptx2html/htmlir/compiler.py::_text_align
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _text_align(computed_or_value: Any) -> str:
    if isinstance(computed_or_value, dict):
        value = computed_or_value.get("textAlign")
        direction = str(computed_or_value.get("direction") or "ltr").strip().lower()
    else:
        value = computed_or_value
        direction = "ltr"
    raw = str(value or "").strip().lower()
    raw = raw.replace("-webkit-", "").replace("-moz-", "")
    if raw in {"center", "centre"}:
        return "ctr"
    if raw == "right":
        return "r"
    if raw in {"justify", "justify-all"}:
        return "just"
    if raw == "start":
        return "r" if direction == "rtl" else "l"
    if raw == "end":
        return "l" if direction == "rtl" else "r"
    if raw == "match-parent":
        return "r" if direction == "rtl" else "l"
    return "l"

_text_align.__module__ = 'pptx2html.htmlir.compiler'
