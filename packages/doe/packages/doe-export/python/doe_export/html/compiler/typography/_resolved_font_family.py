# Origin: pptx2html/htmlir/compiler.py::_resolved_font_family
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._first_font_family import _first_font_family

def _resolved_font_family(computed: dict[str, Any]) -> str:
    resolved = str(computed.get("resolvedFontFamily") or "").strip().strip("\"'")
    if resolved:
        return resolved
    return _first_font_family(str(computed.get("fontFamily") or "Arial"))

_resolved_font_family.__module__ = 'pptx2html.htmlir.compiler'
