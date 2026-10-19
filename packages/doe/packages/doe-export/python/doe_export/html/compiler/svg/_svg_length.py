# Origin: pptx2html/htmlir/compiler.py::_svg_length
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_float import _css_float

def _svg_length(value: Any, view_box: tuple[float, float, float, float], axis: str) -> float:
    raw = str(value if value is not None else "0").strip()
    if not raw:
        return 0.0
    _, _, view_width, view_height = view_box
    if axis == "x":
        basis = view_width
    elif axis == "y":
        basis = view_height
    else:
        basis = (view_width + view_height) / 2.0
    if raw.endswith("%"):
        return basis * _css_float(raw[:-1], 0.0) / 100.0
    match = re.match(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", raw)
    return float(match.group(0)) if match else 0.0

_svg_length.__module__ = 'pptx2html.htmlir.compiler'
