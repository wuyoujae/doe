# Origin: pptx2html/htmlir/compiler.py::_css_gradient_stop_position
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _css_gradient_stop_position(part: str) -> float | None:
    color_match = re.search(r"rgba?\([^)]+\)|color\([^)]+\)|#[0-9a-fA-F]{3,8}", part, re.IGNORECASE)
    tail = part[color_match.end():] if color_match else part
    percent_match = re.search(r"([-+]?\d+(?:\.\d+)?)%", tail)
    if percent_match:
        return float(percent_match.group(1)) / 100.0
    return None

_css_gradient_stop_position.__module__ = 'pptx2html.htmlir.compiler'
