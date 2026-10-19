# Origin: pptx2html/htmlir/compiler.py::_css_transform_rotation
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import math, re
from doe_export.html.compiler.geometry._normalize_rotation_degrees import _normalize_rotation_degrees

def _css_transform_rotation(computed: dict[str, Any]) -> float | None:
    raw = str(computed.get("transform") or "").strip()
    if not raw or raw.lower() == "none":
        return None
    rotate_match = re.search(r"rotate(?:z)?\(\s*([-+]?\d+(?:\.\d+)?)(deg|rad|turn)?", raw, re.IGNORECASE)
    if rotate_match:
        value = float(rotate_match.group(1))
        unit = (rotate_match.group(2) or "deg").lower()
        if unit == "rad":
            value = math.degrees(value)
        elif unit == "turn":
            value *= 360.0
        return _normalize_rotation_degrees(value)
    matrix = re.search(r"matrix\(\s*([^)]+)\)", raw, re.IGNORECASE)
    if not matrix:
        return None
    parts = [part.strip() for part in matrix.group(1).split(",")]
    if len(parts) != 6:
        return None
    try:
        a, b, c, d, _e, _f = [float(part) for part in parts]
    except ValueError:
        return None
    scale_x = math.hypot(a, b)
    scale_y = math.hypot(c, d)
    if scale_x <= 0 or scale_y <= 0:
        return None
    dot = (a * c + b * d) / (scale_x * scale_y)
    if abs(dot) > 0.02:
        return None
    angle = math.degrees(math.atan2(b, a))
    return _normalize_rotation_degrees(angle)

_css_transform_rotation.__module__ = 'pptx2html.htmlir.compiler'
