# Origin: pptx2html/htmlir/compiler.py::capture_html_screenshots
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import base64, math
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.browser._invoke_browser_snapshot import _invoke_browser_snapshot
from doe_export.html.compiler.browser.recycle_browser_snapshot_worker import recycle_browser_snapshot_worker

def capture_html_screenshots(
    items: list[dict[str, Any]],
    *,
    viewport: tuple[int, int] = (1280, 720),
    device_scale_factor: float = 1.5,
    timeout_ms: int = 30000,
    concurrency: int = 2,
    omit_background: bool = False,
) -> list[bytes]:
    """Render complete HTML documents to PNG bytes with the shared Chromium worker."""

    if not items:
        return []
    payload = {
        "items": items,
        "viewport": {"width": viewport[0], "height": viewport[1]},
        "device_scale_factor": max(1.0, min(float(device_scale_factor), 3.0)),
        "timeout_ms": timeout_ms,
        "max_nodes": 1,
        "screenshot_only": True,
        "omit_background": bool(omit_background),
        "concurrency": max(1, min(int(concurrency), 4)),
    }
    batches = max(1, math.ceil(len(items) / payload["concurrency"]))
    invoke_timeout_ms = max(timeout_ms, timeout_ms * batches)
    for attempt in range(2):
        result = _invoke_browser_snapshot(payload, timeout_ms=invoke_timeout_ms)
        snapshots = result.get("results")
        if not isinstance(snapshots, list) or len(snapshots) != len(items):
            if attempt == 0:
                recycle_browser_snapshot_worker()
                continue
            raise HtmlCompileError(
                "html screenshot batch returned invalid results",
                [HtmlDiagnostic("error", "screenshot-batch-results", "Browser screenshot batch returned an invalid result list.")],
            )
        images: list[bytes] = []
        retry_runtime_failure = False
        for index, snapshot in enumerate(snapshots):
            encoded = snapshot.get("screenshot_png_base64") if isinstance(snapshot, dict) else None
            if isinstance(encoded, str) and encoded:
                images.append(base64.b64decode(encoded))
                continue
            message = snapshot.get("error") if isinstance(snapshot, dict) else None
            error_kind = snapshot.get("error_kind") if isinstance(snapshot, dict) else None
            if attempt == 0 and error_kind != "content":
                retry_runtime_failure = True
                break
            raise HtmlCompileError(
                "html screenshot batch failed",
                [HtmlDiagnostic("error", "screenshot-missing", str(message or f"Slide {index + 1} returned no PNG."))],
            )
        if not retry_runtime_failure:
            return images
        recycle_browser_snapshot_worker()
    raise AssertionError("unreachable screenshot retry state")

capture_html_screenshots.__module__ = 'pptx2html.htmlir.compiler'
