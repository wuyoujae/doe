# Origin: pptx2html/htmlir/compiler.py::_paragraph_text_lines
from __future__ import annotations
from doe_export.html.compiler.typography._normalize_text_for_white_space import _normalize_text_for_white_space
from doe_export.html.compiler.typography._preserves_newlines import _preserves_newlines
from doe_export.html.compiler.typography._preserves_spaces import _preserves_spaces

def _paragraph_text_lines(text: str, white_space: str) -> list[str]:
    if _preserves_newlines(white_space):
        lines = text.split("\n")
        if _preserves_spaces(white_space):
            return [line for line in lines if line or len(lines) == 1]
        return [line.strip() for line in lines if line.strip()]
    cleaned = _normalize_text_for_white_space(text, white_space)
    return [cleaned] if cleaned else []

_paragraph_text_lines.__module__ = 'pptx2html.htmlir.compiler'
