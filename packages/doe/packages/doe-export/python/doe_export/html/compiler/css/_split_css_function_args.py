# Origin: pptx2html/htmlir/compiler.py::_split_css_function_args
from __future__ import annotations
from doe_export.html.compiler.css._split_css_shadow_list import _split_css_shadow_list

def _split_css_function_args(raw: str) -> list[str]:
    return [part for part in _split_css_shadow_list(raw) if part]

_split_css_function_args.__module__ = 'pptx2html.htmlir.compiler'
