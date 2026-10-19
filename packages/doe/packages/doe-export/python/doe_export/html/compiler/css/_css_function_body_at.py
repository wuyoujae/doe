# Origin: pptx2html/htmlir/compiler.py::_css_function_body_at
from __future__ import annotations

def _css_function_body_at(value: str, open_index: int) -> tuple[str, int]:
    if open_index < 0 or open_index >= len(value) or value[open_index] != "(":
        return "", open_index
    depth = 0
    quote: str | None = None
    for index in range(open_index, len(value)):
        char = value[index]
        if quote:
            if char == quote:
                quote = None
            continue
        if char in {"'", '"'}:
            quote = char
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return value[open_index + 1:index], index
    return value[open_index + 1:], len(value) - 1

_css_function_body_at.__module__ = 'pptx2html.htmlir.compiler'
