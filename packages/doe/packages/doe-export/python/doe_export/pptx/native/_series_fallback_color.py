# Origin: schema_v4_native.py::_series_fallback_color
from __future__ import annotations
from .shared import DEFAULT_CHART_COLORS

def _series_fallback_color(component_type: str, index: int) -> str:
    if component_type in {
        "grouped-bar-chart",
        "line-chart",
        "stacked-bar-chart",
        "radar-chart",
        "donut-chart",
    }:
        return DEFAULT_CHART_COLORS[index % len(DEFAULT_CHART_COLORS)]
    return "203754"

_series_fallback_color.__module__ = 'schema_v4_native'
