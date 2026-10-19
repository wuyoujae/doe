# Origin: pptx2html/htmlir/compiler.py::_css_white_space
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_white_space(computed: dict[str, Any]) -> str:
    raw = str(computed.get("whiteSpace") or "normal").strip().lower()
    raw = raw.replace("_", "-")
    if raw in {"pre", "pre-wrap", "pre-line", "nowrap", "break-spaces"}:
        return raw
    # CSS Text Level 4 computed values can be serialized as two keywords in
    # newer engines. Normalize the combinations that map cleanly to legacy
    # single-keyword behavior used by DrawingML text frames.
    if raw in {"preserve nowrap", "preserve no-wrap"}:
        return "pre"
    if raw in {"preserve wrap", "preserve"}:
        return "pre-wrap"
    if raw in {"collapse nowrap", "nowrap"}:
        return "nowrap"
    return "normal"

_css_white_space.__module__ = 'pptx2html.htmlir.compiler'
