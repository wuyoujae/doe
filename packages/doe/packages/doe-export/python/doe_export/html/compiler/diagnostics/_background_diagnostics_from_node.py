# Origin: pptx2html/htmlir/compiler.py::_background_diagnostics_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_background_layers import _css_background_layers
from doe_export.html.compiler.diagnostics._diagnostic_value import _diagnostic_value
from doe_export.html.compiler.document._first_background_layer_value import _first_background_layer_value

def _background_diagnostics_from_node(node: dict[str, Any], fill: Fill | None) -> list[str]:
    computed = _computed(node)
    diagnostics: list[str] = []

    def add(item: str) -> None:
        if item not in diagnostics:
            diagnostics.append(item)

    raw_image = str(computed.get("backgroundImage") or "").strip()
    if raw_image and raw_image != "none":
        add("htmlir:background-image")
        layers = _css_background_layers(raw_image)
        if len(layers) > 1:
            add("htmlir:background-multiple-first")
        first = layers[0].lower() if layers else raw_image.lower()
        if "linear-gradient(" in first:
            add("htmlir:background-linear-gradient")
        if "repeating-linear-gradient(" in first:
            add("htmlir:background-repeating-gradient")
        if "radial-gradient(" in first:
            add("htmlir:background-radial-gradient")
        if "repeating-radial-gradient(" in first:
            add("htmlir:background-repeating-gradient")
            add("htmlir:background-radial-gradient")
        if "url(" in first:
            add("htmlir:background-picture")
    if fill is not None and fill.type == "gradient" and fill.gradient_path:
        add(f"htmlir:background-gradient-path-{_diagnostic_value(fill.gradient_path)}")
    if fill is not None and fill.type == "picture":
        add("htmlir:background-picture-fill")

    repeat = _diagnostic_value(_first_background_layer_value(computed.get("backgroundRepeat")))
    if repeat and repeat != "repeat":
        add("htmlir:background-repeat")
        add(f"htmlir:background-repeat-{repeat}")
    size = _diagnostic_value(_first_background_layer_value(computed.get("backgroundSize")))
    if size and size != "auto":
        add("htmlir:background-size")
        add(f"htmlir:background-size-{size}")
    position = _diagnostic_value(_first_background_layer_value(computed.get("backgroundPosition")))
    if position and position not in {"0-0", "0px-0px", "0%-0%"}:
        add("htmlir:background-position")
    attachment = _diagnostic_value(_first_background_layer_value(computed.get("backgroundAttachment")))
    if attachment and attachment != "scroll":
        add("htmlir:background-attachment")
        add(f"htmlir:background-attachment-{attachment}")
    blend = _diagnostic_value(_first_background_layer_value(computed.get("backgroundBlendMode")))
    if blend and blend != "normal":
        add("htmlir:background-blend-mode-first-pass")
    clip = _diagnostic_value(_first_background_layer_value(computed.get("backgroundClip")))
    if clip and clip != "border-box":
        add("htmlir:background-clip")
        add(f"htmlir:background-clip-{clip}")
    origin = _diagnostic_value(_first_background_layer_value(computed.get("backgroundOrigin")))
    if origin and origin != "padding-box":
        add("htmlir:background-origin")
        add(f"htmlir:background-origin-{origin}")
    return diagnostics

_background_diagnostics_from_node.__module__ = 'pptx2html.htmlir.compiler'
