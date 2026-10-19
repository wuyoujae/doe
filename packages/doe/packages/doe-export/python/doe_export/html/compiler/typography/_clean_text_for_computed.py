# Origin: pptx2html/htmlir/compiler.py::_clean_text_for_computed
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._css_white_space import _css_white_space
from doe_export.html.compiler.typography._normalize_text_for_white_space import _normalize_text_for_white_space
from doe_export.html.compiler.typography._preserves_newlines import _preserves_newlines
from doe_export.html.compiler.typography._preserves_spaces import _preserves_spaces

def _clean_text_for_computed(value: str, computed: dict[str, Any]) -> str:
    white_space = _css_white_space(computed)
    text = _normalize_text_for_white_space(value, white_space)
    if _preserves_newlines(white_space):
        lines = text.split("\n")
        if _preserves_spaces(white_space):
            return "\n".join(lines).strip("\n")
        return "\n".join(line.strip() for line in lines if line.strip())
    return text.strip()

_clean_text_for_computed.__module__ = 'pptx2html.htmlir.compiler'
