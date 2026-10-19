# Origin: pptx2html/htmlir/compiler.py::_css_named_function_arguments
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_function_body_at import _css_function_body_at

def _css_named_function_arguments(value: Any, name: str) -> list[str]:
    raw = str(value or "")
    lowered_name = name.lower()
    args: list[str] = []
    index = 0
    while index < len(raw):
        match = re.search(r"([a-zA-Z-]+)\s*\(", raw[index:])
        if not match:
            break
        fn_name = match.group(1).lower()
        open_index = index + match.end() - 1
        body, close_index = _css_function_body_at(raw, open_index)
        if fn_name == lowered_name:
            args.append(body.strip())
        index = close_index + 1
    return args

_css_named_function_arguments.__module__ = 'pptx2html.htmlir.compiler'
