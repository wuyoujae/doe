# Origin: pptx2html/htmlir/compiler.py::_object_fit_contain_bounds
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds, CSS_PX_TO_PT
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_object_position_fractions import _css_object_position_fractions

def _object_fit_contain_bounds(node: dict[str, Any], bounds: Bounds) -> Bounds:
    computed = _computed(node)
    if str(computed.get("objectFit") or "").lower() not in {"contain", "scale-down"}:
        return bounds
    media = node.get("media") or {}
    width, height = float(media.get("naturalWidth") or 0), float(media.get("naturalHeight") or 0)
    if width <= 0 or height <= 0:
        return bounds
    scale = min(bounds.width / width, bounds.height / height)
    if computed.get("objectFit") == "scale-down":
        scale = min(scale, CSS_PX_TO_PT)
    width, height = width * scale, height * scale
    x, y = _css_object_position_fractions(computed.get("objectPosition"))
    return Bounds(bounds.left + (bounds.width - width) * x, bounds.top + (bounds.height - height) * y, width, height)

_object_fit_contain_bounds.__module__ = 'pptx2html.htmlir.compiler'
