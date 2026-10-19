# Origin: pptx_pipeline.py::_scale_border_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number

def _scale_border_for_export(border: Any, metric_scale: float) -> None:
    if isinstance(border, dict):
        _scale_optional_number(border, "width", metric_scale)

_scale_border_for_export.__module__ = 'pptx_pipeline'
