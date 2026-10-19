# Origin: pptx_pipeline.py::_scale_shape_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_border_for_export import _scale_border_for_export
from doe_export.pipeline.geometry._scale_bounds_for_export import _scale_bounds_for_export
from doe_export.pipeline.assets._scale_fill_image_for_export import _scale_fill_image_for_export
from doe_export.pipeline.assets._scale_image_for_export import _scale_image_for_export
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number
from doe_export.pipeline.geometry._scale_shadow_for_export import _scale_shadow_for_export
from doe_export.pipeline.geometry._scale_table_for_export import _scale_table_for_export
from doe_export.pipeline.text_layout._scale_text_frame_for_export import _scale_text_frame_for_export

def _scale_shape_for_export(
    shape: dict[str, Any],
    scale_x: float,
    scale_y: float,
) -> None:
    metric_scale = min(scale_x, scale_y)
    _scale_bounds_for_export(shape.get("bounds"), scale_x, scale_y)
    _scale_bounds_for_export(shape.get("group_bounds"), scale_x, scale_y)
    _scale_border_for_export(shape.get("border"), metric_scale)
    _scale_shadow_for_export(shape.get("shadow"), scale_x, scale_y, metric_scale)
    for effect in shape.get("effects") or []:
        _scale_shadow_for_export(effect, scale_x, scale_y, metric_scale)
    _scale_text_frame_for_export(shape.get("text"), scale_x, scale_y, metric_scale)
    _scale_table_for_export(shape.get("table"), scale_x, scale_y, metric_scale)
    _scale_image_for_export(shape.get("image"), scale_x, scale_y)
    _scale_fill_image_for_export(shape.get("fill"), scale_x, scale_y)
    three_d = shape.get("three_d")
    if isinstance(three_d, dict):
        for key in (
            "bevel_top_width",
            "bevel_top_height",
            "bevel_bottom_width",
            "bevel_bottom_height",
            "extrusion_height",
            "contour_width",
        ):
            _scale_optional_number(three_d, key, metric_scale)
    for child in shape.get("shapes") or []:
        if isinstance(child, dict):
            _scale_shape_for_export(child, scale_x, scale_y)

_scale_shape_for_export.__module__ = 'pptx_pipeline'
