# Origin: pptx2html/htmlir/compiler.py::_run_browser_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.browser._invoke_browser_snapshot import _invoke_browser_snapshot

def _run_browser_snapshot(
    *,
    source: str,
    base_url: str | None,
    root_selector: str | None = None,
    viewport: tuple[int, int],
    timeout_ms: int,
    max_dom_nodes: int,
    fragment: bool = False,
    screenshot_selector: str | None = None,
    include_screenshot: bool = True,
) -> dict[str, Any]:
    payload = {
        "fragment" if fragment else "source": source,
        "base_url": base_url,
        "viewport": {"width": viewport[0], "height": viewport[1]},
        "timeout_ms": timeout_ms,
        "max_nodes": max_dom_nodes,
    }
    if root_selector:
        payload["root_selector"] = root_selector
    if screenshot_selector:
        payload["screenshot_selector"] = screenshot_selector
    if not include_screenshot:
        payload["skip_screenshot"] = True
    return _invoke_browser_snapshot(payload, timeout_ms=timeout_ms)

_run_browser_snapshot.__module__ = 'pptx2html.htmlir.compiler'
