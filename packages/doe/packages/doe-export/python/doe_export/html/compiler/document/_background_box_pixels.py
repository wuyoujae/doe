# Origin: pptx2html/htmlir/compiler.py::_background_box_pixels
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import CSS_PX_TO_PT
from doe_export.html.compiler.css._css_float import _css_float

def _background_box_pixels(node: dict[str, Any], bounds: Bounds | None) -> tuple[float, float]:
    rect = node.get("rect") if isinstance(node.get("rect"), dict) else {}
    width = _css_float(rect.get("width"), 0.0)
    height = _css_float(rect.get("height"), 0.0)
    if width <= 0 and bounds is not None:
        width = bounds.width / CSS_PX_TO_PT
    if height <= 0 and bounds is not None:
        height = bounds.height / CSS_PX_TO_PT
    return width, height

_background_box_pixels.__module__ = 'pptx2html.htmlir.compiler'
