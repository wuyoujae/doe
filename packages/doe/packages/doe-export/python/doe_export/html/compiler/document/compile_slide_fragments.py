# Origin: pptx2html/htmlir/compiler.py::compile_slide_fragments
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import CANONICAL_SLIDE_SELECTOR, DEFAULT_MAX_DOM_NODES, DEFAULT_TIMEOUT_MS
from doe_export.html.compiler.diagnostics.HtmlCompileError import HtmlCompileError
from doe_export.html.compiler.diagnostics.HtmlDiagnostic import HtmlDiagnostic
from doe_export.html.compiler.diagnostics._append_escaped_markup_diagnostic import _append_escaped_markup_diagnostic
from doe_export.html.compiler.diagnostics._append_truncated_canonical_payload_diagnostic import _append_truncated_canonical_payload_diagnostic
from doe_export.html.compiler.snapshot._canonical_snapshot_source import _canonical_snapshot_source
from doe_export.html.compiler.document._close_truncated_canonical_payload import _close_truncated_canonical_payload
from doe_export.html.compiler.browser._compile_browser_snapshot import _compile_browser_snapshot
from doe_export.html.compiler.document._compile_canonical_html import _compile_canonical_html
from doe_export.html.compiler.document._is_canonical_html import _is_canonical_html
from doe_export.html.compiler.document._normalize_serialized_html_source import _normalize_serialized_html_source
from doe_export.html.compiler.document._normalize_viewport import _normalize_viewport
from doe_export.html.compiler.browser._run_browser_snapshot_batch import _run_browser_snapshot_batch
from doe_export.html.compiler.document._validate_source_and_mode import _validate_source_and_mode

def compile_slide_fragments(
    items: list[dict[str, Any]],
    *,
    include_ast: bool = False,
    include_browser_screenshot: bool = True,
    base_url: str | None = None,
    viewport: tuple[int, int] = (1920, 1080),
    timeout_ms: int = DEFAULT_TIMEOUT_MS,
    max_dom_nodes: int = DEFAULT_MAX_DOM_NODES,
    render_mode: str = "semantic",
    concurrency: int = 2,
    require_editable_coverage: bool = False,
) -> list[dict[str, Any]]:
    """Compile multiple fragments while sharing one Chromium process."""

    if not isinstance(items, list) or not items:
        raise HtmlCompileError(
            "Expected at least one slide fragment",
            [HtmlDiagnostic("error", "empty-items", "Expected at least one slide fragment.")],
        )
    _validate_source_and_mode("batch", render_mode)
    viewport = _normalize_viewport(viewport)
    render_mode = str(render_mode or "semantic").strip().lower()
    browser_items: list[dict[str, Any]] = []
    canonical_items: list[bool] = []
    normalized_fragments: list[str] = []
    escaped_markup_recoveries: list[bool] = []
    truncated_payload_recoveries: list[bool] = []
    for position, item in enumerate(items):
        fragment = item.get("fragment") if isinstance(item, dict) else None
        if not isinstance(fragment, str) or not fragment.strip():
            raise HtmlCompileError(
                "Expected non-empty slide fragment",
                [HtmlDiagnostic("error", "empty-fragment", f"Slide item {position} has no fragment.")],
            )
        fragment, escaped_markup_recovered = _normalize_serialized_html_source(fragment)
        fragment, truncated_payload_recovered = _close_truncated_canonical_payload(fragment)
        is_canonical = render_mode == "semantic" and _is_canonical_html(fragment)
        browser_item = {
            "id": str(item.get("id") or position),
            "base_url": item.get("base_url") if isinstance(item.get("base_url"), str) else base_url,
        }
        if is_canonical:
            browser_item.update(
                {
                    "source": _canonical_snapshot_source(fragment),
                    "screenshot_selector": CANONICAL_SLIDE_SELECTOR,
                }
            )
        else:
            browser_item["fragment"] = fragment
        browser_items.append(browser_item)
        canonical_items.append(is_canonical)
        normalized_fragments.append(fragment)
        escaped_markup_recoveries.append(escaped_markup_recovered)
        truncated_payload_recoveries.append(truncated_payload_recovered)

    snapshots = _run_browser_snapshot_batch(
        items=browser_items,
        viewport=viewport,
        timeout_ms=timeout_ms,
        max_dom_nodes=max_dom_nodes,
        concurrency=concurrency,
    )
    results: list[dict[str, Any]] = []
    for position, snapshot in enumerate(snapshots):
        item_id = browser_items[position]["id"]
        if not snapshot.get("success"):
            results.append(
                {
                    "id": item_id,
                    "success": False,
                    "error": str(snapshot.get("error") or "Compilation failed"),
                    "error_kind": (
                        "content" if snapshot.get("error_kind") == "content" else "runtime"
                    ),
                }
            )
            continue
        if canonical_items[position]:
            compiled = _compile_canonical_html(
                source=normalized_fragments[position],
                slide_index=int(items[position].get("slide_index") or position),
                include_ast=include_ast,
                include_browser_screenshot=include_browser_screenshot,
                base_url=base_url,
                viewport=viewport,
                timeout_ms=timeout_ms,
                max_dom_nodes=max_dom_nodes,
                snapshot=snapshot,
                force_browser_validation=(
                    escaped_markup_recoveries[position]
                    or truncated_payload_recoveries[position]
                ),
            )
        else:
            try:
                compiled = _compile_browser_snapshot(
                    snapshot,
                    slide_index=int(items[position].get("slide_index") or position),
                    include_ast=include_ast,
                    include_browser_screenshot=include_browser_screenshot,
                    viewport=viewport,
                    render_mode=render_mode,
                    require_editable_coverage=require_editable_coverage,
                )
            except HtmlCompileError as error:
                diagnostic_items = [item.to_dict() for item in error.diagnostics]
                unsupported = any(
                    item.get("code")
                    in {
                        "unsupported-visible-element",
                        "unsupported-pseudo-content",
                        "unsupported-text-pseudo-style",
                        "unsupported-svg-element",
                        "unsupported-svg-feature",
                    }
                    for item in diagnostic_items
                )
                results.append(
                    {
                        "id": item_id,
                        "success": False,
                        "error": str(error),
                        "error_kind": "content" if unsupported else "runtime",
                        "diagnostics": diagnostic_items,
                    }
                )
                continue
        _append_escaped_markup_diagnostic(
            compiled,
            escaped_markup_recoveries[position],
        )
        _append_truncated_canonical_payload_diagnostic(
            compiled,
            truncated_payload_recoveries[position],
        )
        compiled["id"] = item_id
        results.append(compiled)
    return results

compile_slide_fragments.__module__ = 'pptx2html.htmlir.compiler'
