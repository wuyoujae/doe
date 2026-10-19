# Origin: pptx2html/htmlir/compiler.py::_normalize_text_for_white_space
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _normalize_text_for_white_space(value: str, white_space: str) -> str:
    raw = str(value or "").replace("\u00a0", " ").replace("\r\n", "\n").replace("\r", "\n")
    if white_space in {"pre", "pre-wrap", "break-spaces"}:
        return raw
    if white_space == "pre-line":
        return "\n".join(re.sub(r"[ \t\f\v]+", " ", line) for line in raw.split("\n"))
    return re.sub(r"[ \t\r\n\f\v]+", " ", raw)

_normalize_text_for_white_space.__module__ = 'pptx2html.htmlir.compiler'
