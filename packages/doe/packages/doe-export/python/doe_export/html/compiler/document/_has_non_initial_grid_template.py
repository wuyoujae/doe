# Origin: pptx2html/htmlir/compiler.py::_has_non_initial_grid_template
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _has_non_initial_grid_template(computed: dict[str, Any]) -> bool:
    for key in ("gridTemplateColumns", "gridTemplateRows", "gridTemplateAreas"):
        raw = str(computed.get(key) or "").strip().lower()
        if raw and raw != "none":
            return True
    return False

_has_non_initial_grid_template.__module__ = 'pptx2html.htmlir.compiler'
