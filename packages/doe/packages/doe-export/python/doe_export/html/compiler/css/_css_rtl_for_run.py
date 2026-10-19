# Origin: pptx2html/htmlir/compiler.py::_css_rtl_for_run
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_direction import _css_direction

def _css_rtl_for_run(run_computed: dict[str, Any], paragraph_computed: dict[str, Any]) -> bool | None:
    direction = _css_direction(run_computed)
    if direction == "rtl":
        return True
    if direction == "ltr" and _css_direction(paragraph_computed) == "rtl":
        return False
    return None

_css_rtl_for_run.__module__ = 'pptx2html.htmlir.compiler'
