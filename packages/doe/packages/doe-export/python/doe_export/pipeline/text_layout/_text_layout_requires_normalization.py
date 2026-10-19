# Origin: pptx_pipeline.py::_text_layout_requires_normalization
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import layout_snapshot_is_valid

def _text_layout_requires_normalization(
    text_frame,
    container_metrics: dict[str, Any] | None,
) -> bool:
    if text_frame.layout_snapshot_dirty:
        return True
    htmlir_authored = any(
        str(value).startswith("htmlir:")
        for value in (text_frame.style_provenance or [])
    )
    if text_frame.layout_snapshot is None:
        return htmlir_authored
    if not htmlir_authored:
        return False
    return container_metrics is None or not layout_snapshot_is_valid(
        text_frame,
        container_metrics=container_metrics,
    )

_text_layout_requires_normalization.__module__ = 'pptx_pipeline'
