# Origin: pptx2html/htmlir/compiler.py::_svg_paint_opacity
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.svg._svg_attr_style_or_computed import _svg_attr_style_or_computed

def _svg_paint_opacity(path_node: dict[str, Any], svg_node: dict[str, Any], paint: str) -> float:
    raw = _svg_attr_style_or_computed(path_node, svg_node, f"{paint}-opacity", f"{paint}Opacity")
    if raw is None:
        raw = _svg_attr_style_or_computed(svg_node, svg_node, f"{paint}-opacity", f"{paint}Opacity")
    return max(0.0, min(1.0, _css_float(raw, 1.0)))

_svg_paint_opacity.__module__ = 'pptx2html.htmlir.compiler'
