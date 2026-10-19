# Origin: pptx2html/htmlir/compiler.py::_background_fills_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.css._background_layer_fill import _background_layer_fill
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_background_layers import _css_background_layers
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.typography._uses_background_clip_text import _uses_background_clip_text

def _background_fills_from_node(node: dict[str, Any], bounds: Bounds | None = None) -> list[Fill]:
    computed = _computed(node)
    if _uses_background_clip_text(computed):
        return []
    opacity = _element_opacity(node)
    fills: list[Fill] = []
    color = _css_color(computed.get("backgroundColor"))
    if color is not None:
        alpha = color[1] * opacity
        if alpha > 0.01:
            fills.append(Fill(type="solid", color=color[0], alpha=alpha if alpha < 0.999 else None))

    background_image = str(computed.get("backgroundImage") or "").strip()
    if background_image and background_image != "none":
        layers = _css_background_layers(background_image)
        for layer_index in reversed(range(len(layers))):
            layer_fill = _background_layer_fill(
                layers[layer_index],
                computed,
                opacity,
                node=node,
                bounds=bounds,
                layer_index=layer_index,
                layer_count=len(layers),
            )
            if layer_fill is not None:
                fills.append(layer_fill)
    return fills

_background_fills_from_node.__module__ = 'pptx2html.htmlir.compiler'
