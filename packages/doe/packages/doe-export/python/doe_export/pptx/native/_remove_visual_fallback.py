# Origin: schema_v4_native.py::_remove_visual_fallback
from __future__ import annotations
from ._shape_intersection_ratio import _shape_intersection_ratio

def _remove_visual_fallback(slide, bounds: dict[str, float]) -> None:
    for shape in list(slide.shapes):
        if getattr(shape, "has_table", False) or getattr(shape, "has_chart", False):
            continue
        if _shape_intersection_ratio(shape, bounds) < 0.5:
            continue
        shape._element.getparent().remove(shape._element)

_remove_visual_fallback.__module__ = 'schema_v4_native'
