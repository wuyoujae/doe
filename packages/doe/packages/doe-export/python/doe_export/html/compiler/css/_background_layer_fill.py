# Origin: pptx2html/htmlir/compiler.py::_background_layer_fill
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.geometry._apply_background_image_geometry import _apply_background_image_geometry
from doe_export.html.compiler.document._background_layer_property import _background_layer_property
from doe_export.html.compiler.css._css_url import _css_url
from doe_export.html.compiler.css._first_css_color import _first_css_color
from doe_export.html.compiler.css._gradient_fill import _gradient_fill
from doe_export.html.compiler.assets._image_info_from_src import _image_info_from_src

def _background_layer_fill(
    layer: str,
    computed: dict[str, Any],
    opacity: float = 1.0,
    *,
    node: dict[str, Any] | None = None,
    bounds: Bounds | None = None,
    layer_index: int = 0,
    layer_count: int = 1,
) -> Fill | None:
    lowered = layer.lower()
    if "gradient(" in lowered:
        fill = _gradient_fill(layer, opacity)
        if fill is not None:
            return fill
    url = _css_url(layer)
    if url:
        image = _image_info_from_src(url, opacity)
        _apply_background_image_geometry(
            image,
            node or {},
            bounds,
            size=_background_layer_property(computed, "backgroundSize", layer_index, layer_count) or "auto",
            position=(
                _background_layer_property(computed, "backgroundPosition", layer_index, layer_count)
                or " ".join(
                    part
                    for part in (
                        _background_layer_property(computed, "backgroundPositionX", layer_index, layer_count),
                        _background_layer_property(computed, "backgroundPositionY", layer_index, layer_count),
                    )
                    if part
                )
                or "0% 0%"
            ),
            repeat=_background_layer_property(computed, "backgroundRepeat", layer_index, layer_count) or "repeat",
        )
        return Fill(type="picture", image=image)
    fallback_color = _first_css_color(layer)
    if fallback_color is not None:
        alpha = fallback_color[1] * opacity
        if alpha > 0.01:
            return Fill(type="solid", color=fallback_color[0], alpha=alpha if alpha < 0.999 else None)
    return None

_background_layer_fill.__module__ = 'pptx2html.htmlir.compiler'
