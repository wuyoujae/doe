# Origin: pptx2html/htmlir/reconcile.py::_failure
from __future__ import annotations
from doe_export.html.reconcile.shared import Any
from doe_export.html.reconcile.diagnostics._diagnostic import _diagnostic

def _failure(code: str, message: str) -> dict[str, Any]:
    return {
        "success": False,
        "presentation": None,
        "diagnostics": [_diagnostic("error", code, message)],
        "reconcile_mode": "semantic-fallback",
    }

_failure.__module__ = 'pptx2html.htmlir.reconcile'
