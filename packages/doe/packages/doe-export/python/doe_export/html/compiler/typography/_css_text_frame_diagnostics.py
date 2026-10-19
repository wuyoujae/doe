# Origin: pptx2html/htmlir/compiler.py::_css_text_frame_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_column_count import _css_column_count
from doe_export.html.compiler.typography._css_vertical_text import _css_vertical_text
from doe_export.html.compiler.diagnostics._diagnostic_value import _diagnostic_value

def _css_text_frame_diagnostics(computed: dict[str, Any]) -> list[str]:
    diagnostics: list[str] = []
    if _css_column_count(computed):
        diagnostics.append("htmlir:text-columns")
    if _css_vertical_text(computed):
        diagnostics.append("htmlir:text-vertical")
        orientation = _diagnostic_value(computed.get("textOrientation"))
        if orientation and orientation != "mixed":
            diagnostics.append(f"htmlir:text-orientation-{orientation}")
    return diagnostics

_css_text_frame_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
