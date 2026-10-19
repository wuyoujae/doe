# Origin: pptx2html/htmlir/compiler.py::_svg_stroke_dash
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_px import _css_px
from doe_export.html.compiler.svg._svg_attr_style_or_computed import _svg_attr_style_or_computed

def _svg_stroke_dash(node: dict[str, Any], svg_node: dict[str, Any]) -> str:
    raw = str(_svg_attr_style_or_computed(node, svg_node, "stroke-dasharray", "strokeDasharray") or "").strip().lower()
    if not raw or raw == "none":
        return "solid"
    values = [
        float(match.group(0))
        for match in re.finditer(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?", raw)
    ]
    stroke_width = _css_px(_svg_attr_style_or_computed(node, svg_node, "stroke-width", "strokeWidth")) or 1
    if values and len(values) <= 2 and min(values) > 0 and max(values) <= stroke_width * 1.5:
        return "dot"
    return "dash"

_svg_stroke_dash.__module__ = 'pptx2html.htmlir.compiler'
