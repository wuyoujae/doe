# Origin: pptx2html/htmlir/compiler.py::_append_shadow_diagnostics
from __future__ import annotations
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.css._shadow_diagnostics import _shadow_diagnostics

def _append_shadow_diagnostics(target: list[str], shadow: Shadow | None) -> None:
    for diagnostic in _shadow_diagnostics(shadow):
        if diagnostic not in target:
            target.append(diagnostic)

_append_shadow_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
