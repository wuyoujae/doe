# Origin: pptx2html/htmlir/compiler.py::_css_time_list_has_duration
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_float import _css_float

def _css_time_list_has_duration(value: Any) -> bool:
    raw = str(value or "").strip().lower()
    if not raw:
        return False
    for token in re.split(r"\s*,\s*", raw):
        token = token.strip()
        if token.endswith("ms") and _css_float(token[:-2], 0.0) > 0:
            return True
        if token.endswith("s") and _css_float(token[:-1], 0.0) > 0:
            return True
    return False

_css_time_list_has_duration.__module__ = 'pptx2html.htmlir.compiler'
