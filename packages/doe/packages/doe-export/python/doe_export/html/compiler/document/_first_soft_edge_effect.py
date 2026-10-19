# Origin: pptx2html/htmlir/compiler.py::_first_soft_edge_effect
from __future__ import annotations
from doe_export.html.compiler.shared import Shadow

def _first_soft_edge_effect(effects: list[Shadow]) -> Shadow | None:
    for effect in effects:
        if effect.type == "softEdge":
            return effect
    return None

_first_soft_edge_effect.__module__ = 'pptx2html.htmlir.compiler'
