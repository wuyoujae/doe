# Origin: pptx2html/htmlir/compiler.py::_set_browser_text_layout_snapshot
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TextFrame
from doe_export.html.compiler.shared import InvalidTextLayoutSnapshot, create_layout_snapshot, refresh_no_wrap_layout_snapshot
from doe_export.html.compiler.typography._map_visual_soft_breaks_to_paragraph import _map_visual_soft_breaks_to_paragraph
from doe_export.html.compiler.typography._validated_visual_text_layout import _validated_visual_text_layout

def _set_browser_text_layout_snapshot(
    text_frame: TextFrame,
    paragraph_nodes: list[tuple[int, dict[str, Any]]],
    container_metrics: dict[str, Any],
) -> bool:
    if refresh_no_wrap_layout_snapshot(
        text_frame,
        container_metrics=container_metrics,
    ):
        return True
    soft_breaks: list[dict[str, int]] = []
    for paragraph_index, node in paragraph_nodes:
        layout = _validated_visual_text_layout(node)
        if layout is None:
            return False
        mapped = _map_visual_soft_breaks_to_paragraph(
            node,
            text_frame,
            paragraph_index,
            layout,
        )
        if mapped is None:
            return False
        soft_breaks.extend(mapped)
    try:
        text_frame.layout_snapshot = create_layout_snapshot(
            text_frame,
            soft_breaks,
            container_metrics=container_metrics,
        )
    except (InvalidTextLayoutSnapshot, TypeError, ValueError, OverflowError):
        return False
    text_frame.layout_snapshot_dirty = False
    if "htmlir:visual-layout-snapshot" not in text_frame.diagnostics:
        text_frame.diagnostics.append("htmlir:visual-layout-snapshot")
    return True

_set_browser_text_layout_snapshot.__module__ = 'pptx2html.htmlir.compiler'
