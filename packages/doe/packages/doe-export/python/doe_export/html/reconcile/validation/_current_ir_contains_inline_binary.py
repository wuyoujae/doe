# Origin: pptx2html/htmlir/reconcile.py::_current_ir_contains_inline_binary
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, ir_contains_inline_asset

def _current_ir_contains_inline_binary(value: Any) -> bool:
    return ir_contains_inline_asset(value)

_current_ir_contains_inline_binary.__module__ = 'pptx2html.htmlir.reconcile'
