# Origin: pptx2html/htmlir/compiler.py::recycle_browser_snapshot_worker
from __future__ import annotations

def recycle_browser_snapshot_worker() -> None:
    """Close the shared Chromium worker so the next request starts cleanly."""
    from doe_export.html.compiler.browser.state import _BROWSER_SNAPSHOT_WORKER

    _BROWSER_SNAPSHOT_WORKER.close()

recycle_browser_snapshot_worker.__module__ = 'pptx2html.htmlir.compiler'
