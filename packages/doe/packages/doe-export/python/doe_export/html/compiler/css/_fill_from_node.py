# Origin: pptx2html/htmlir/compiler.py::_fill_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.shared import Fill
from doe_export.html.compiler.css._background_fills_from_node import _background_fills_from_node

def _fill_from_node(node: dict[str, Any], bounds: Bounds | None = None) -> Fill | None:
    fills = _background_fills_from_node(node, bounds)
    return fills[-1] if fills else None

_fill_from_node.__module__ = 'pptx2html.htmlir.compiler'
