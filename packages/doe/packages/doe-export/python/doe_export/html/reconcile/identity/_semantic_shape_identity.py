# Origin: pptx2html/htmlir/reconcile.py::_semantic_shape_identity
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _semantic_shape_identity(shape: dict[str, Any]) -> str | None:
    diagnostics = shape.get("diagnostics")
    if isinstance(diagnostics, list):
        for diagnostic in diagnostics:
            if isinstance(diagnostic, str) and diagnostic.startswith(
                "yrkie:element-id="
            ):
                return diagnostic.split("=", 1)[1]
    return None

_semantic_shape_identity.__module__ = 'pptx2html.htmlir.reconcile'
