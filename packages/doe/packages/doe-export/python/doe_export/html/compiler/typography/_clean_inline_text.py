# Origin: pptx2html/htmlir/compiler.py::_clean_inline_text
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.typography._css_white_space import _css_white_space
from doe_export.html.compiler.typography._normalize_text_for_white_space import _normalize_text_for_white_space

def _clean_inline_text(value: str, computed: dict[str, Any]) -> str:
    return _normalize_text_for_white_space(value, _css_white_space(computed))

_clean_inline_text.__module__ = 'pptx2html.htmlir.compiler'
