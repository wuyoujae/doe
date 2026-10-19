# Origin: pptx_pipeline.py::_scale_shadow_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number

def _scale_shadow_for_export(
    shadow: Any,
    scale_x: float,
    scale_y: float,
    metric_scale: float,
) -> None:
    if not isinstance(shadow, dict):
        return
    _scale_optional_number(shadow, "offset_x", scale_x)
    _scale_optional_number(shadow, "offset_y", scale_y)
    _scale_optional_number(shadow, "blur_pt", metric_scale)

_scale_shadow_for_export.__module__ = 'pptx_pipeline'
