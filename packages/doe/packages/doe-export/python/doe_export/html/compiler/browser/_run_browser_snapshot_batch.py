# Origin: pptx2html/htmlir/compiler.py::_run_browser_snapshot_batch
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import math
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.browser._invoke_browser_snapshot import _invoke_browser_snapshot

def _run_browser_snapshot_batch(
    *,
    items: list[dict[str, Any]],
    viewport: tuple[int, int],
    timeout_ms: int,
    max_dom_nodes: int,
    concurrency: int,
) -> list[dict[str, Any]]:
    payload = {
        "items": items,
        "viewport": {"width": viewport[0], "height": viewport[1]},
        "timeout_ms": timeout_ms,
        "max_nodes": max_dom_nodes,
        "concurrency": max(1, min(int(concurrency), 4)),
    }
    data = _invoke_browser_snapshot(
        payload,
        timeout_ms=max(timeout_ms, timeout_ms * max(1, math.ceil(len(items) / max(1, concurrency)))),
    )
    results = data.get("results")
    if not isinstance(results, list):
        raise HtmlCompileError(
            "html browser batch returned no results",
            [HtmlDiagnostic("error", "snapshot-batch-results", "Browser batch returned no result list.")],
        )
    return [item if isinstance(item, dict) else {"success": False, "error": "Invalid batch item"} for item in results]

_run_browser_snapshot_batch.__module__ = 'pptx2html.htmlir.compiler'
