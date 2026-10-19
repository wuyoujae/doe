# Origin: pptx2html/htmlir/compiler.py::_text_frame_needs_browser_layout
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TextFrame
from doe_export.html.compiler.shared import layout_snapshot_is_valid

def _text_frame_needs_browser_layout(
    text_frame: TextFrame,
    container_metrics: dict[str, Any],
) -> bool:
    if text_frame.layout_snapshot_dirty:
        return True
    if not any(str(value).startswith("htmlir:") for value in text_frame.style_provenance or []):
        return False
    return text_frame.layout_snapshot is None or not layout_snapshot_is_valid(
        text_frame,
        container_metrics=container_metrics,
    )

_text_frame_needs_browser_layout.__module__ = 'pptx2html.htmlir.compiler'
