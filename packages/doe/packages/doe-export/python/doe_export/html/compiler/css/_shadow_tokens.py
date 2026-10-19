# Origin: pptx2html/htmlir/compiler.py::_shadow_tokens
from __future__ import annotations

def _shadow_tokens(raw: str) -> list[str]:
    tokens: list[str] = []
    current: list[str] = []
    depth = 0
    quote: str | None = None
    for char in str(raw or ""):
        if quote:
            current.append(char)
            if char == quote:
                quote = None
            continue
        if char in {"'", '"'}:
            quote = char
            current.append(char)
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth = max(0, depth - 1)
        if char.isspace() and depth == 0:
            if current:
                tokens.append("".join(current))
                current = []
        else:
            current.append(char)
    if current:
        tokens.append("".join(current))
    return tokens

_shadow_tokens.__module__ = 'pptx2html.htmlir.compiler'
