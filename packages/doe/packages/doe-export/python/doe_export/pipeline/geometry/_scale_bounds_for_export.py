# Origin: pptx_pipeline.py::_scale_bounds_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number

def _scale_bounds_for_export(
    bounds: Any,
    scale_x: float,
    scale_y: float,
) -> None:
    if not isinstance(bounds, dict):
        return
    for key in ("left", "width"):
        _scale_optional_number(bounds, key, scale_x)
    for key in ("top", "height"):
        _scale_optional_number(bounds, key, scale_y)

_scale_bounds_for_export.__module__ = 'pptx_pipeline'
