# Origin: pptx_pipeline.py::_scale_optional_number
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import math

def _scale_optional_number(container: dict[str, Any], key: str, scale: float) -> None:
    value = container.get(key)
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        scaled = float(value) * scale
        if math.isfinite(scaled):
            container[key] = scaled

_scale_optional_number.__module__ = 'pptx_pipeline'
