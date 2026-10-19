# Origin: pptx2html/htmlir/compiler.py::_float_box_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.document._HtmlFloatBox import _HtmlFloatBox
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_float_value import _css_float_value

def _float_box_from_node(node: dict[str, Any], path: str, bounds: Bounds) -> _HtmlFloatBox | None:
    side = _css_float_value(_computed(node))
    if side not in {"left", "right"} or not path:
        return None
    return _HtmlFloatBox(path=path, side=side, bounds=bounds)

_float_box_from_node.__module__ = 'pptx2html.htmlir.compiler'
