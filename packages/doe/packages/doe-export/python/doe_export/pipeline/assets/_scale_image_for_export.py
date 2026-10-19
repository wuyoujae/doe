# Origin: pptx_pipeline.py::_scale_image_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number

def _scale_image_for_export(image: Any, scale_x: float, scale_y: float) -> None:
    if not isinstance(image, dict):
        return
    _scale_optional_number(image, "intrinsic_width_pt", scale_x)
    _scale_optional_number(image, "intrinsic_height_pt", scale_y)
    _scale_optional_number(image, "tile_offset_x_pt", scale_x)
    _scale_optional_number(image, "tile_offset_y_pt", scale_y)

_scale_image_for_export.__module__ = 'pptx_pipeline'
