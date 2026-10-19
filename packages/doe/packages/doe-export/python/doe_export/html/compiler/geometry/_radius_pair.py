# Origin: pptx2html/htmlir/compiler.py::_radius_pair
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.css._css_length_or_percent import _css_length_or_percent

def _radius_pair(value: Any, bounds: Bounds, scale_x: float, scale_y: float) -> tuple[float, float]:
    raw = str(value or "").strip().lower()
    if not raw:
        return 0.0, 0.0
    raw = raw.replace("/", " ")
    parts = [part for part in raw.split() if part]
    if not parts:
        return 0.0, 0.0
    horizontal = _css_length_or_percent(parts[0], bounds.width, scale_x)
    vertical = _css_length_or_percent(parts[1] if len(parts) > 1 else parts[0], bounds.height, scale_y)
    return max(0.0, horizontal), max(0.0, vertical)

_radius_pair.__module__ = 'pptx2html.htmlir.compiler'
