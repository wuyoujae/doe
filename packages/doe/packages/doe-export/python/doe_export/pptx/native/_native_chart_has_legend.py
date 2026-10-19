# Origin: schema_v4_native.py::_native_chart_has_legend
from __future__ import annotations
from .shared import Any

def _native_chart_has_legend(component: dict[str, Any]) -> bool:
    props = component.get("props") if isinstance(component.get("props"), dict) else {}
    content = props.get("content") if isinstance(props.get("content"), dict) else {}
    return (
        str(component.get("type") or "") != "waterfall-chart"
        and bool(props.get("showLegend", content.get("showLegend", True)))
        and not (
            str(component.get("type") or "") == "stacked-bar-chart"
            and content.get("legendReversed") is True
        )
    )

_native_chart_has_legend.__module__ = 'schema_v4_native'
