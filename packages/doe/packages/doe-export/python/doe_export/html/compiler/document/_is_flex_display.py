# Origin: pptx2html/htmlir/compiler.py::_is_flex_display
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _is_flex_display(computed: dict[str, Any]) -> bool:
    return str(computed.get("display") or "").strip().lower() in {"flex", "inline-flex"}

_is_flex_display.__module__ = 'pptx2html.htmlir.compiler'
