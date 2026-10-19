# Origin: pptx2html/htmlir/compiler.py::_ast_from_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _ast_from_snapshot(snapshot: dict[str, Any]) -> dict[str, Any]:
    data = snapshot.get("snapshot") if isinstance(snapshot.get("snapshot"), dict) else {}
    return {
        "kind": "htmlir-browser-snapshot",
        "viewport": snapshot.get("viewport"),
        "deviceScaleFactor": snapshot.get("deviceScaleFactor"),
        "document": data.get("document"),
        "nodes": data.get("nodes") or [],
        "truncated": bool(data.get("truncated")),
    }

_ast_from_snapshot.__module__ = 'pptx2html.htmlir.compiler'
