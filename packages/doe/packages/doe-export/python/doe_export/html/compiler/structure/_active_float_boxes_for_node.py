# Origin: pptx2html/htmlir/compiler.py::_active_float_boxes_for_node
from __future__ import annotations
from doe_export.html.compiler.document._HtmlFloatBox import _HtmlFloatBox
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Bounds
from doe_export.html.compiler.geometry._bounds_bottom import _bounds_bottom
from doe_export.html.compiler.css._css_clear_value import _css_clear_value
from doe_export.html.compiler.document._path_is_descendant import _path_is_descendant

def _active_float_boxes_for_node(
    boxes: list[_HtmlFloatBox],
    path: str,
    bounds: Bounds,
    computed: dict[str, Any],
) -> list[_HtmlFloatBox]:
    clear_value = _css_clear_value(computed)
    result: list[_HtmlFloatBox] = []
    for box in boxes:
        if path and (path == box.path or _path_is_descendant(path, box.path)):
            result.append(box)
            continue
        if _bounds_bottom(box.bounds) <= bounds.top + 0.25:
            continue
        if clear_value == "both" or clear_value == box.side:
            continue
        result.append(box)
    return result

_active_float_boxes_for_node.__module__ = 'pptx2html.htmlir.compiler'
