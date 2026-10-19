# Origin: pptx2html/htmlir/compiler.py::normalize_canonical_text_layout
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import DEFAULT_TIMEOUT_MS, DEFAULT_VIEWPORT, copy
from doe_export.html.compiler.snapshot._ast_from_snapshot import _ast_from_snapshot
from doe_export.html.compiler.document._normalize_viewport import _normalize_viewport
from doe_export.html.compiler.browser._run_browser_snapshot import _run_browser_snapshot
from doe_export.html.compiler.browser.apply_browser_text_layout_snapshots import apply_browser_text_layout_snapshots

def normalize_canonical_text_layout(
    source: str,
    presentation: Presentation,
    *,
    viewport: tuple[int, int] = DEFAULT_VIEWPORT,
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    max_dom_nodes: int = 50_000,
) -> tuple[Presentation, int]:
    """Re-measure eligible canonical text frames without rebuilding shapes."""

    normalized = copy.deepcopy(presentation)
    snapshot = _run_browser_snapshot(
        source=source,
        base_url=None,
        viewport=_normalize_viewport(viewport),
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
        include_screenshot=False,
        root_selector=".pptx-canonical-deck",
    )
    ast = _ast_from_snapshot(snapshot)
    if ast.get("truncated"):
        return normalized, 0
    nodes = [node for node in ast.get("nodes") or [] if isinstance(node, dict)]
    return normalized, apply_browser_text_layout_snapshots(normalized, nodes)

normalize_canonical_text_layout.__module__ = 'pptx2html.htmlir.compiler'
