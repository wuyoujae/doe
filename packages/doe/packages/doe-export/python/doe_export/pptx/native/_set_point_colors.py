# Origin: schema_v4_native.py::_set_point_colors
from __future__ import annotations
from .shared import Any
from ._rgb import _rgb

def _set_point_colors(series, colors: Any) -> None:
    if not isinstance(colors, list):
        return
    for index, color in enumerate(colors):
        if not color or index >= len(series.points):
            continue
        point = series.points[index]
        point.format.fill.solid()
        point.format.fill.fore_color.rgb = _rgb(color)
        point.format.line.color.rgb = _rgb(color)

_set_point_colors.__module__ = 'schema_v4_native'
