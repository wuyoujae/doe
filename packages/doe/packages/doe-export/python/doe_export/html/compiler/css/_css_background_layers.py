# Origin: pptx2html/htmlir/compiler.py::_css_background_layers
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._split_css_shadow_list import _split_css_shadow_list

def _css_background_layers(value: Any) -> list[str]:
    return [part for part in _split_css_shadow_list(str(value or "")) if part]

_css_background_layers.__module__ = 'pptx2html.htmlir.compiler'
