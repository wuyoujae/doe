# Origin: pptx2html/htmlir/compiler.py::_background_layer_property
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_background_layers import _css_background_layers

def _background_layer_property(
    computed: dict[str, Any],
    name: str,
    layer_index: int,
    layer_count: int,
) -> str:
    values = _css_background_layers(computed.get(name))
    if not values:
        return ""
    # CSS repeats a shorter property list until it matches background-image.
    normalized_index = max(0, min(layer_index, max(0, layer_count - 1)))
    return values[normalized_index % len(values)].strip()

_background_layer_property.__module__ = 'pptx2html.htmlir.compiler'
