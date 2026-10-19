# Origin: pptx2html/htmlir/compiler.py::_normalized_track_sizes
from __future__ import annotations

def _normalized_track_sizes(values: list[float | None], total: float) -> list[float]:
    count = len(values)
    if count <= 0:
        return []
    positive: list[float | None] = [value if value is not None and value > 0 else None for value in values]
    declared_total = sum(value for value in positive if value is not None)
    missing = sum(1 for value in positive if value is None)
    fallback = max(1.0, (total - declared_total) / missing) if missing and total > declared_total else max(1.0, total / count)
    result = [max(1.0, value if value is not None else fallback) for value in positive]
    current_total = sum(result)
    if total > 0 and current_total > 0:
        scale = total / current_total
        result = [max(1.0, value * scale) for value in result]
    return [round(value, 3) for value in result]

_normalized_track_sizes.__module__ = 'pptx2html.htmlir.compiler'
