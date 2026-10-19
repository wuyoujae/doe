# Origin: pptx2html/htmlir/compiler.py::_tab_space_factor
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _tab_space_factor(computed: dict[str, Any]) -> float:
    family = str(computed.get("fontFamily") or "").lower()
    if any(name in family for name in ("mono", "consolas", "courier", "menlo", "monaco")):
        return 0.6
    return 0.28

_tab_space_factor.__module__ = 'pptx2html.htmlir.compiler'
