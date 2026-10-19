# Origin: pptx2html/htmlir/compiler.py::_background_repeat_modes
from __future__ import annotations

def _background_repeat_modes(value: str) -> tuple[str, str]:
    tokens = [token for token in str(value or "repeat").strip().lower().split() if token]
    if not tokens:
        return "repeat", "repeat"
    if tokens[0] == "repeat-x":
        return "repeat", "no-repeat"
    if tokens[0] == "repeat-y":
        return "no-repeat", "repeat"
    if len(tokens) == 1:
        return tokens[0], tokens[0]
    return tokens[0], tokens[1]

_background_repeat_modes.__module__ = 'pptx2html.htmlir.compiler'
