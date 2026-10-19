# Origin: pptx2html/htmlir/compiler.py::apply_browser_text_layout_snapshots
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import refresh_no_wrap_layout_snapshot
from doe_export.html.compiler.typography._canonical_paragraph_layout_nodes import _canonical_paragraph_layout_nodes
from doe_export.html.compiler.typography._presentation_text_layout_entries import _presentation_text_layout_entries
from doe_export.html.compiler.browser._set_browser_text_layout_snapshot import _set_browser_text_layout_snapshot
from doe_export.html.compiler.browser._text_frame_needs_browser_layout import _text_frame_needs_browser_layout

def apply_browser_text_layout_snapshots(
    presentation: Presentation,
    nodes: list[dict[str, Any]],
) -> int:
    """Patch hash-bound Chromium layout snapshots by canonical text key."""

    keyed_nodes: dict[str, dict[str, Any]] = {}
    for node in nodes:
        attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
        key = str(attrs.get("data-pptx-text-key") or "").strip()
        if key and key not in keyed_nodes:
            keyed_nodes[key] = node

    patched = 0
    for key, text_frame, metrics in _presentation_text_layout_entries(presentation):
        if not _text_frame_needs_browser_layout(text_frame, metrics):
            continue
        if refresh_no_wrap_layout_snapshot(
            text_frame,
            container_metrics=metrics,
        ):
            patched += 1
            continue
        container_node = keyed_nodes.get(key)
        if container_node is None:
            continue
        paragraph_nodes = _canonical_paragraph_layout_nodes(container_node, nodes, text_frame)
        if paragraph_nodes is None:
            continue
        if _set_browser_text_layout_snapshot(text_frame, paragraph_nodes, metrics):
            patched += 1
    return patched

apply_browser_text_layout_snapshots.__module__ = 'pptx2html.htmlir.compiler'
