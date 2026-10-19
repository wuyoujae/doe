# Origin: pptx2html/htmlir/compiler.py::_css_gradient_angle
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _css_gradient_angle(preamble: str) -> float:
    angle_match = re.search(r"([-+]?\d+(?:\.\d+)?)deg", preamble, re.IGNORECASE)
    if angle_match:
        return (float(angle_match.group(1)) - 90.0) % 360.0
    direction = preamble.strip().lower()
    if direction.startswith("to "):
        if "right" in direction and "bottom" in direction:
            return 45.0
        if "left" in direction and "bottom" in direction:
            return 135.0
        if "left" in direction and "top" in direction:
            return 225.0
        if "right" in direction and "top" in direction:
            return 315.0
        if "right" in direction:
            return 0.0
        if "bottom" in direction:
            return 90.0
        if "left" in direction:
            return 180.0
        if "top" in direction:
            return 270.0
    return 0.0

_css_gradient_angle.__module__ = 'pptx2html.htmlir.compiler'
