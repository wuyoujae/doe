# Origin: schema_v4_native.py::_shape_intersection_ratio
from __future__ import annotations
from .shared import EMU_PER_POINT

def _shape_intersection_ratio(shape, bounds: dict[str, float]) -> float:
    left = shape.left / EMU_PER_POINT
    top = shape.top / EMU_PER_POINT
    right = left + shape.width / EMU_PER_POINT
    bottom = top + shape.height / EMU_PER_POINT
    target_left = bounds["left"]
    target_top = bounds["top"]
    target_right = target_left + bounds["width"]
    target_bottom = target_top + bounds["height"]
    width = max(0.0, min(right, target_right) - max(left, target_left))
    height = max(0.0, min(bottom, target_bottom) - max(top, target_top))
    area = max(1.0, (right - left) * (bottom - top))
    return (width * height) / area

_shape_intersection_ratio.__module__ = 'schema_v4_native'
