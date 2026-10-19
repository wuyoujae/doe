# Origin: pptx2html/htmlir/compiler.py::_css_function_arguments
from __future__ import annotations

def _css_function_arguments(value: str) -> str:
    start = value.find("(")
    if start < 0:
        return value
    depth = 0
    quote: str | None = None
    for index, char in enumerate(value[start:], start=start):
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
                return value[start + 1:index]
    return value[start + 1:]

_css_function_arguments.__module__ = 'pptx2html.htmlir.compiler'
