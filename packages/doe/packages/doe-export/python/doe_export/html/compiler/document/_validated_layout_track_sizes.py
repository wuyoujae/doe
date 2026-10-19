# Origin: pptx2html/htmlir/compiler.py::_validated_layout_track_sizes
from __future__ import annotations
from doe_export.html.compiler.shared import math

def _validated_layout_track_sizes(
    values: list[float] | None,
    count: int,
) -> list[float] | None:
    if not values or len(values) < count:
        return None
    result = [float(value or 0.0) for value in values[:count]]
    if any(not math.isfinite(value) or value <= 0 for value in result):
        return None
    return result

_validated_layout_track_sizes.__module__ = 'pptx2html.htmlir.compiler'
