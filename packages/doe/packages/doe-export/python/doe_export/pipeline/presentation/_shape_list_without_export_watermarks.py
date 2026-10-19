# Origin: pptx_pipeline.py::_shape_list_without_export_watermarks
from __future__ import annotations
from doe_export.pipeline.shared import Any

def _shape_list_without_export_watermarks(shapes: list[Any]) -> list[Any]:
    cleaned: list[Any] = []
    for shape in shapes:
        if not isinstance(shape, dict):
            cleaned.append(shape)
            continue
        if (shape.get("name") or "").strip().casefold() == "yrkie export watermark":
            continue
        if isinstance(shape.get("shapes"), list):
            shape["shapes"] = _shape_list_without_export_watermarks(shape["shapes"])
        cleaned.append(shape)
    return cleaned

_shape_list_without_export_watermarks.__module__ = 'pptx_pipeline'
