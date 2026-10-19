# Origin: pptx2html/htmlir/compiler.py::_background_image_fill
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.css._background_layer_fill import _background_layer_fill
from doe_export.html.compiler.css._css_background_layers import _css_background_layers

def _background_image_fill(computed: dict[str, Any], opacity: float = 1.0) -> Fill | None:
    raw_image = str(computed.get("backgroundImage") or "").strip()
    if not raw_image or raw_image == "none":
        return None
    layers = _css_background_layers(raw_image)
    for layer_index, layer in enumerate(layers):
        fill = _background_layer_fill(
            layer,
            computed,
            opacity,
            layer_index=layer_index,
            layer_count=len(layers),
        )
        if fill is not None:
            return fill
    return None

_background_image_fill.__module__ = 'pptx2html.htmlir.compiler'
