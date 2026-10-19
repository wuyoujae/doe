# Origin: schema_v4_native.py::_add_native_chart
from __future__ import annotations
from .shared import Any, EMU_PER_POINT, SUPPORTED_CHART_TYPES
from ._chart_data import _chart_data
from ._format_native_chart import _format_native_chart
from ._native_chart_has_legend import _native_chart_has_legend
from ._number import _number
from ._remove_visual_fallback import _remove_visual_fallback

def _add_native_chart(slide, component: dict[str, Any]) -> None:
    bounds = component.get("bounds_pt")
    if not isinstance(bounds, dict):
        return
    normalized_bounds = {
        key: _number(bounds.get(key)) for key in ("left", "top", "width", "height")
    }
    if normalized_bounds["width"] <= 0 or normalized_bounds["height"] <= 0:
        return
    chart_type = SUPPORTED_CHART_TYPES.get(str(component.get("type") or ""))
    if chart_type is None:
        return
    data, series_meta = _chart_data(component)
    _remove_visual_fallback(slide, normalized_bounds)
    legend_bounds = component.get("legend_bounds_pt")
    if isinstance(legend_bounds, dict):
        normalized_legend_bounds = {
            key: _number(legend_bounds.get(key))
            for key in ("left", "top", "width", "height")
        }
        if normalized_legend_bounds["width"] > 0 and normalized_legend_bounds["height"] > 0:
            if _native_chart_has_legend(component):
                _remove_visual_fallback(slide, normalized_legend_bounds)
                left = min(normalized_bounds["left"], normalized_legend_bounds["left"])
                top = min(normalized_bounds["top"], normalized_legend_bounds["top"])
                right = max(
                    normalized_bounds["left"] + normalized_bounds["width"],
                    normalized_legend_bounds["left"] + normalized_legend_bounds["width"],
                )
                bottom = max(
                    normalized_bounds["top"] + normalized_bounds["height"],
                    normalized_legend_bounds["top"] + normalized_legend_bounds["height"],
                )
                normalized_bounds = {
                    "left": left,
                    "top": top,
                    "width": right - left,
                    "height": bottom - top,
                }
    chart = slide.shapes.add_chart(
        chart_type,
        int(normalized_bounds["left"] * EMU_PER_POINT),
        int(normalized_bounds["top"] * EMU_PER_POINT),
        int(normalized_bounds["width"] * EMU_PER_POINT),
        int(normalized_bounds["height"] * EMU_PER_POINT),
        data,
    ).chart
    _format_native_chart(chart, component, series_meta)

_add_native_chart.__module__ = 'schema_v4_native'
