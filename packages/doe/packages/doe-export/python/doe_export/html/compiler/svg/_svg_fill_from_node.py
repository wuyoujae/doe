# Origin: pptx2html/htmlir/compiler.py::_svg_fill_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.svg._svg_effective_opacity import _svg_effective_opacity
from doe_export.html.compiler.svg._svg_paint_color import _svg_paint_color
from doe_export.html.compiler.svg._svg_paint_opacity import _svg_paint_opacity

def _svg_fill_from_node(node: dict[str, Any], svg_node: dict[str, Any], tag: str) -> Fill | None:
    if tag == "line":
        return None
    color = _svg_paint_color(node, svg_node, "fill")
    if color is None:
        return None
    alpha = color[1] * _svg_paint_opacity(node, svg_node, "fill") * _svg_effective_opacity(node, svg_node)
    if alpha <= 0.01:
        return None
    return Fill(type="solid", color=color[0], alpha=alpha if alpha < 0.999 else None)

_svg_fill_from_node.__module__ = 'pptx2html.htmlir.compiler'
