# Origin: pptx2html/htmlir/compiler.py::_unique_diagnostics
from __future__ import annotations

def _unique_diagnostics(items: list[str]) -> list[str]:
    result: list[str] = []
    for item in items:
        if item and item not in result:
            result.append(item)
    return result

_unique_diagnostics.__module__ = 'pptx2html.htmlir.compiler'
