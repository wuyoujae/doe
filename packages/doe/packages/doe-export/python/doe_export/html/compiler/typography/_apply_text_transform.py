# Origin: pptx2html/htmlir/compiler.py::_apply_text_transform
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _apply_text_transform(text: str, value: Any) -> str:
    transform = str(value or "").strip().lower()
    if transform == "uppercase":
        return text.upper()
    if transform == "lowercase":
        return text.lower()
    if transform == "capitalize":
        return " ".join(part[:1].upper() + part[1:] for part in text.split(" "))
    return text

_apply_text_transform.__module__ = 'pptx2html.htmlir.compiler'
