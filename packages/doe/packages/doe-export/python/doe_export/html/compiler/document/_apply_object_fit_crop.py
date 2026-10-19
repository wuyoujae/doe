# Origin: pptx2html/htmlir/compiler.py::_apply_object_fit_crop
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import ImageInfo
from doe_export.html.compiler.document._apply_cover_crop import _apply_cover_crop
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_object_position_fractions import _css_object_position_fractions

def _apply_object_fit_crop(image: ImageInfo, node: dict[str, Any], bounds: Bounds) -> None:
    computed = _computed(node)
    if str(computed.get("objectFit") or "").strip().lower() != "cover":
        return
    media = node.get("media") if isinstance(node.get("media"), dict) else {}
    natural_width = _css_float(media.get("naturalWidth"), 0)
    natural_height = _css_float(media.get("naturalHeight"), 0)
    if natural_width <= 0 or natural_height <= 0 or bounds.width <= 0 or bounds.height <= 0:
        return
    position_x, position_y = _css_object_position_fractions(computed.get("objectPosition"))
    _apply_cover_crop(
        image,
        natural_width,
        natural_height,
        bounds.width,
        bounds.height,
        position_x,
        position_y,
    )

_apply_object_fit_crop.__module__ = 'pptx2html.htmlir.compiler'
