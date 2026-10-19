# Origin: pptx2html/htmlir/compiler.py::_svg_paint_color
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_color import _css_color
from doe_export.html.compiler.svg._svg_attr_style_or_computed import _svg_attr_style_or_computed

def _svg_paint_color(path_node: dict[str, Any], svg_node: dict[str, Any], paint: str) -> tuple[str, float] | None:
    raw_values = [
        _svg_attr_style_or_computed(path_node, svg_node, paint, paint),
        _svg_attr_style_or_computed(svg_node, svg_node, paint, paint),
    ]
    for raw in raw_values:
        value = str(raw or "").strip()
        if not value:
            continue
        lowered = value.lower()
        if lowered in {"none", "transparent"}:
            return None
        if lowered.startswith("url("):
            return None
        if lowered == "currentcolor":
            computed = _computed(path_node) or _computed(svg_node)
            value = str(computed.get("color") or _computed(svg_node).get("color") or "")
        color = _css_color(value)
        if color is not None:
            return color
    if paint == "fill":
        return "000000", 1.0
    return None

_svg_paint_color.__module__ = 'pptx2html.htmlir.compiler'
