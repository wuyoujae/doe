# Origin: pptx_pipeline.py::_shape_list_has_export_watermark
from __future__ import annotations
from doe_export.pipeline.shared import Any

def _shape_list_has_export_watermark(shapes: list[Any]) -> bool:
    for shape in shapes:
        if not isinstance(shape, dict):
            continue
        if (shape.get("name") or "").strip().casefold() == "yrkie export watermark":
            return True
        if isinstance(shape.get("shapes"), list) and _shape_list_has_export_watermark(
            shape["shapes"]
        ):
            return True
    return False

_shape_list_has_export_watermark.__module__ = 'pptx_pipeline'
