# Origin: pptx2html/htmlir/compiler.py::_first_background_layer_value
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_background_layers import _css_background_layers

def _first_background_layer_value(value: Any) -> str:
    parts = _css_background_layers(value)
    return parts[0] if parts else str(value or "")

_first_background_layer_value.__module__ = 'pptx2html.htmlir.compiler'
