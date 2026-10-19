# Origin: pptx2html/htmlir/compiler.py::_shadow_host_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.css._shadow_diagnostics import _shadow_diagnostics
from doe_export.html.compiler.diagnostics._unique_diagnostics import _unique_diagnostics

def _shadow_host_diagnostics(shadow: Shadow | None, layout_diagnostics: list[str]) -> list[str]:
    diagnostics = _shadow_diagnostics(shadow)
    if shadow is not None and shadow.type != "softEdge" and "htmlir:box-shadow-transparent-host" not in diagnostics:
        diagnostics.append("htmlir:box-shadow-transparent-host")
    return _unique_diagnostics(diagnostics + layout_diagnostics)

_shadow_host_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
