# Origin: pptx2html/htmlir/compiler.py::_element_opacity
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float import _css_float

def _element_opacity(node: dict[str, Any]) -> float:
    computed_opacity = _css_float(_computed(node).get("opacity"), 1.0)
    effective_opacity = _css_float(node.get("effectiveOpacity"), computed_opacity)
    return max(0.0, min(1.0, effective_opacity))

_element_opacity.__module__ = 'pptx2html.htmlir.compiler'
