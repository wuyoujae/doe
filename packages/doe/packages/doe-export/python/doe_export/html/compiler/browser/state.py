from __future__ import annotations
from doe_export.html.compiler.shared import atexit
from doe_export.html.compiler.browser._BrowserSnapshotWorker import _BrowserSnapshotWorker

_BROWSER_SNAPSHOT_WORKER = _BrowserSnapshotWorker()

atexit.register(_BROWSER_SNAPSHOT_WORKER.close)
