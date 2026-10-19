# Origin: pptx2html/htmlir/compiler.py::_css_filter_function_names
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_function_body_at import _css_function_body_at

def _css_filter_function_names(value: Any) -> list[str]:
    raw = str(value or "")
    names: list[str] = []
    index = 0
    while index < len(raw):
        match = re.search(r"([a-zA-Z-]+)\s*\(", raw[index:])
        if not match:
            break
        names.append(match.group(1).lower())
        open_index = index + match.end() - 1
        _body, close_index = _css_function_body_at(raw, open_index)
        index = close_index + 1
    return names

_css_filter_function_names.__module__ = 'pptx2html.htmlir.compiler'
