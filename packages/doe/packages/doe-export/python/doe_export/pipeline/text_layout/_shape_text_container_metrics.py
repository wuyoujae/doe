# Origin: pptx_pipeline.py::_shape_text_container_metrics
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.text_layout._text_container_metrics import _text_container_metrics

def _shape_text_container_metrics(shape) -> dict[str, Any] | None:
    bounds = shape.bounds
    if bounds is None:
        return None
    width = bounds.width
    height = bounds.height
    if shape.text_rect is not None:
        width *= (shape.text_rect.right - shape.text_rect.left) / 100.0
        height *= (shape.text_rect.bottom - shape.text_rect.top) / 100.0
    return _text_container_metrics(width, height)

_shape_text_container_metrics.__module__ = 'pptx_pipeline'
