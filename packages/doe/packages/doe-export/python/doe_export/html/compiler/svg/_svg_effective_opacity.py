# Origin: pptx2html/htmlir/compiler.py::_svg_effective_opacity
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._element_opacity import _element_opacity

def _svg_effective_opacity(path_node: dict[str, Any], svg_node: dict[str, Any]) -> float:
    if path_node.get("effectiveOpacity") is not None:
        return _element_opacity(path_node)
    return _element_opacity(path_node) * _element_opacity(svg_node)

_svg_effective_opacity.__module__ = 'pptx2html.htmlir.compiler'
