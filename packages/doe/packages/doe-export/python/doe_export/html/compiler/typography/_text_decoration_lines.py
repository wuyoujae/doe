# Origin: pptx2html/htmlir/compiler.py::_text_decoration_lines
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re

def _text_decoration_lines(computed: dict[str, Any]) -> set[str]:
    raw = str(computed.get("textDecorationLine") or "").strip().lower()
    if not raw or raw == "none":
        return set()
    return {item for item in re.split(r"\s+", raw) if item and item != "none"}

_text_decoration_lines.__module__ = 'pptx2html.htmlir.compiler'
