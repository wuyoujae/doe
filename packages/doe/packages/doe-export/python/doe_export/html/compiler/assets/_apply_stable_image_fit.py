# Origin: pptx2html/htmlir/compiler.py::_apply_stable_image_fit
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.document._apply_cover_crop import _apply_cover_crop
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_object_position_fractions import _css_object_position_fractions

def _apply_stable_image_fit(
    image: ImageInfo,
    node: dict[str, Any],
    bounds: Bounds | None,
    fit: str,
) -> None:
    if bounds is None or bounds.width <= 0 or bounds.height <= 0:
        return
    media = node.get("media") if isinstance(node.get("media"), dict) else {}
    natural_width = _css_float(media.get("naturalWidth"), 0.0)
    natural_height = _css_float(media.get("naturalHeight"), 0.0)
    if natural_width <= 0 or natural_height <= 0:
        return
    position_x, position_y = _css_object_position_fractions(
        _computed(node).get("objectPosition")
    )
    image.crop_left = image.crop_right = image.crop_top = image.crop_bottom = 0.0
    image.stretch_left = image.stretch_right = None
    image.stretch_top = image.stretch_bottom = None
    if fit == "cover":
        _apply_cover_crop(
            image,
            natural_width,
            natural_height,
            bounds.width,
            bounds.height,
            position_x,
            position_y,
        )
        return
    if fit == "fill":
        return
    natural_width_pt = natural_width * CSS_PX_TO_PT
    natural_height_pt = natural_height * CSS_PX_TO_PT
    if fit == "scale-down" and (
        natural_width_pt <= bounds.width and natural_height_pt <= bounds.height
    ):
        fit = "none"
    if fit in {"contain", "scale-down"}:
        scale = min(
            bounds.width / natural_width_pt,
            bounds.height / natural_height_pt,
        )
        destination_width = natural_width_pt * scale
        destination_height = natural_height_pt * scale
    else:
        destination_width = natural_width_pt
        destination_height = natural_height_pt
    hidden_x = 1.0 - destination_width / bounds.width
    hidden_y = 1.0 - destination_height / bounds.height
    image.stretch_left = hidden_x * position_x
    image.stretch_right = hidden_x * (1.0 - position_x)
    image.stretch_top = hidden_y * position_y
    image.stretch_bottom = hidden_y * (1.0 - position_y)

_apply_stable_image_fit.__module__ = 'pptx2html.htmlir.compiler'
