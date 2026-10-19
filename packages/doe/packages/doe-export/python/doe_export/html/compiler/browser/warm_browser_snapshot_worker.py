# Origin: pptx2html/htmlir/compiler.py::warm_browser_snapshot_worker
from __future__ import annotations
from doe_export.html.compiler.browser._invoke_browser_snapshot import _invoke_browser_snapshot

def warm_browser_snapshot_worker() -> None:
    """Start Chromium before the first user-facing slide compile request."""

    _invoke_browser_snapshot({"command": "ping"}, timeout_ms=20000)

warm_browser_snapshot_worker.__module__ = 'pptx2html.htmlir.compiler'
