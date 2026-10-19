# Origin: pptx2html/htmlir/compiler.py::_is_grid_display
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _is_grid_display(computed: dict[str, Any]) -> bool:
    return str(computed.get("display") or "").strip().lower() in {"grid", "inline-grid"}

_is_grid_display.__module__ = 'pptx2html.htmlir.compiler'
