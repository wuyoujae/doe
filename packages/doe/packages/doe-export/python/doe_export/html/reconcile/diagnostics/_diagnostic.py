# Origin: pptx2html/htmlir/reconcile.py::_diagnostic
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _diagnostic(severity: str, code: str, message: str) -> dict[str, Any]:
    return {
        "severity": severity,
        "code": code,
        "message": message,
        "line": None,
        "column": None,
        "tag": None,
        "attribute": None,
    }

_diagnostic.__module__ = 'pptx2html.htmlir.reconcile'
