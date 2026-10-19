# Origin: pptx2html/htmlir/compiler.py::_css_word_break
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_word_break(computed: dict[str, Any]) -> str:
    raw = str(computed.get("wordBreak") or "normal").strip().lower().replace("_", "-")
    if raw in {"break-all", "keep-all", "break-word"}:
        return raw
    return "normal"

_css_word_break.__module__ = 'pptx2html.htmlir.compiler'
