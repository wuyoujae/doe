# Origin: pptx2html/htmlir/compiler.py::_shadow_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.diagnostics._unique_diagnostics import _unique_diagnostics

def _shadow_diagnostics(shadow: Shadow | None) -> list[str]:
    if shadow is None:
        return []
    diagnostics = list(shadow.diagnostics or [])
    if not diagnostics:
        diagnostics.append("htmlir:box-shadow" if shadow.type != "softEdge" else "htmlir:filter-blur")
    return _unique_diagnostics(diagnostics)

_shadow_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
