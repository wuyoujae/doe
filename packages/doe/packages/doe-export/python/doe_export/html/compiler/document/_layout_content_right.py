# Origin: pptx2html/htmlir/compiler.py::_layout_content_right
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_right import _bounds_right
from doe_export.html.compiler.css._css_px import _css_px

def _layout_content_right(bounds: Bounds, computed: dict[str, Any], sx: float) -> float:
    right_inset = (
        _css_px(computed.get("paddingRight"))
        + _css_px(computed.get("borderRightWidth"))
    ) * sx
    return max(bounds.left, _bounds_right(bounds) - max(0.0, right_inset))

_layout_content_right.__module__ = 'pptx2html.htmlir.compiler'
