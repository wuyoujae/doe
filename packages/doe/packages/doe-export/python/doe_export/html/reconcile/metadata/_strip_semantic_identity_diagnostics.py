# Origin: pptx2html/htmlir/reconcile.py::_strip_semantic_identity_diagnostics
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _strip_semantic_identity_diagnostics(shape: dict[str, Any]) -> None:
    diagnostics = shape.get("diagnostics")
    if isinstance(diagnostics, list):
        shape["diagnostics"] = [
            value
            for value in diagnostics
            if not (
                isinstance(value, str)
                and value.startswith("yrkie:element-")
            )
        ]
    children = shape.get("shapes")
    if isinstance(children, list):
        for child in children:
            if isinstance(child, dict):
                _strip_semantic_identity_diagnostics(child)

_strip_semantic_identity_diagnostics.__module__ = 'pptx2html.htmlir.reconcile'
