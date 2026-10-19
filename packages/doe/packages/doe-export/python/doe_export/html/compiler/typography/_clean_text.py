# Origin: pptx2html/htmlir/compiler.py::_clean_text
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _clean_text(value: str) -> str:
    lines = [re.sub(r"[ \t\r\f\v]+", " ", line).strip() for line in value.replace("\u00a0", " ").splitlines()]
    return "\n".join(line for line in lines if line)

_clean_text.__module__ = 'pptx2html.htmlir.compiler'
