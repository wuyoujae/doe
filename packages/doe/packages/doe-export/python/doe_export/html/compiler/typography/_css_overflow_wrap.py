# Origin: pptx2html/htmlir/compiler.py::_css_overflow_wrap
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_overflow_wrap(computed: dict[str, Any]) -> str:
    raw = str(computed.get("overflowWrap") or computed.get("wordWrap") or "normal").strip().lower()
    raw = raw.replace("_", "-")
    if raw in {"break-word", "anywhere"}:
        return raw
    return "normal"

_css_overflow_wrap.__module__ = 'pptx2html.htmlir.compiler'
