# Origin: pptx2html/htmlir/compiler.py::_has_non_initial_grid_item_props
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _has_non_initial_grid_item_props(computed: dict[str, Any]) -> bool:
    keys = ("gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd")
    return any(str(computed.get(key) or "auto").strip().lower() != "auto" for key in keys)

_has_non_initial_grid_item_props.__module__ = 'pptx2html.htmlir.compiler'
