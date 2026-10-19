# Origin: schema_v4_native.py::_chart_data
from __future__ import annotations
from .shared import Any, ChartData, DEFAULT_CHART_COLORS
from ._number import _number

def _chart_data(component: dict[str, Any]) -> tuple[ChartData, list[dict[str, Any]]]:
    props = component.get("props") if isinstance(component.get("props"), dict) else {}
    content = props.get("content") if isinstance(props.get("content"), dict) else {}
    component_type = str(component.get("type") or "")
    if component_type == "radar-chart":
        axes = content.get("axes") if isinstance(content.get("axes"), list) else []
        categories = [
            str(item.get("label") or f"Axis {index + 1}")
            for index, item in enumerate(axes)
            if isinstance(item, dict)
        ]
        datasets = content.get("datasets") if isinstance(content.get("datasets"), list) else []
        series = [
            {
                "name": item.get("name"),
                "color": item.get("color"),
                "data": item.get("values"),
                "fill_opacity": item.get("fillOpacity"),
            }
            for item in datasets
            if isinstance(item, dict)
        ]
    elif component_type == "donut-chart":
        items = content.get("items") if isinstance(content.get("items"), list) else []
        normalized_items = [item for item in items if isinstance(item, dict)]
        categories = [
            str(item.get("label") or f"Item {index + 1}")
            for index, item in enumerate(normalized_items)
        ]
        series = [
            {
                "name": str(props.get("title") or "Value"),
                "data": [item.get("value") for item in normalized_items],
                "point_colors": [
                    item.get("color") or DEFAULT_CHART_COLORS[index % len(DEFAULT_CHART_COLORS)]
                    for index, item in enumerate(normalized_items)
                ],
            }
        ]
    elif component_type == "waterfall-chart":
        items = content.get("items") if isinstance(content.get("items"), list) else []
        normalized_items = [item for item in items if isinstance(item, dict)]
        categories = [
            str(item.get("label") or f"Item {index + 1}")
            for index, item in enumerate(normalized_items)
        ]
        base: list[float | None] = []
        increases: list[float | None] = []
        decreases: list[float | None] = []
        totals: list[float | None] = []
        total_colors: list[Any] = []
        running = 0.0
        for index, item in enumerate(normalized_items):
            value = _number(item.get("value"))
            if str(item.get("type") or "change") == "total":
                base.append(0.0)
                increases.append(None)
                decreases.append(None)
                totals.append(value)
                total_colors.append(
                    item.get("color")
                    or content.get("endColor" if index == len(normalized_items) - 1 else "totalColor")
                    or ("#1543AD" if index == len(normalized_items) - 1 else "#10317F")
                )
                running = value
            elif value >= 0:
                base.append(running)
                increases.append(value)
                decreases.append(None)
                totals.append(None)
                total_colors.append(None)
                running += value
            else:
                base.append(running + value)
                increases.append(None)
                decreases.append(abs(value))
                totals.append(None)
                total_colors.append(None)
                running += value
        series = [
            {"name": "Base", "data": base, "color": "#FFFFFF", "transparent": True},
            {
                "name": "Increase",
                "data": increases,
                "color": content.get("positiveColor") or "#1B54DA",
            },
            {
                "name": "Decrease",
                "data": decreases,
                "color": content.get("negativeColor") or "#D2DDF8",
            },
            {
                "name": "Total",
                "data": totals,
                "color": content.get("totalColor") or "#10317F",
                "point_colors": total_colors,
            },
        ]
    else:
        categories = content.get("categories") if isinstance(content.get("categories"), list) else []
        series = content.get("series") if isinstance(content.get("series"), list) else []
    data = ChartData()
    data.categories = [str(category) for category in categories]
    normalized_series: list[dict[str, Any]] = []
    for index, item in enumerate(series):
        if not isinstance(item, dict):
            continue
        values = item.get("data") if isinstance(item.get("data"), list) else []
        if len(values) != len(categories):
            continue
        normalized_values = [
            None if value is None else _number(value)
            for value in values
        ]
        normalized = {
            "name": str(item.get("name") or f"Series {index + 1}"),
            "data": normalized_values,
            "color": item.get("color"),
            "point_colors": item.get("point_colors"),
            "transparent": item.get("transparent") is True,
            "fill_opacity": item.get("fill_opacity"),
        }
        normalized_series.append(normalized)
        data.add_series(normalized["name"], normalized["data"])
    if not categories or not normalized_series:
        raise ValueError("Native chart metadata has no usable categories or series.")
    return data, normalized_series

_chart_data.__module__ = 'schema_v4_native'
