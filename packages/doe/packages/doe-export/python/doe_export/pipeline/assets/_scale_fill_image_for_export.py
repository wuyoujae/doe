# Origin: pptx_pipeline.py::_scale_fill_image_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.assets._scale_image_for_export import _scale_image_for_export

def _scale_fill_image_for_export(fill: Any, scale_x: float, scale_y: float) -> None:
    if isinstance(fill, dict):
        _scale_image_for_export(fill.get("image"), scale_x, scale_y)

_scale_fill_image_for_export.__module__ = 'pptx_pipeline'
