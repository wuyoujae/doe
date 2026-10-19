# Origin: schema_v4_native.py::_format_native_chart
from __future__ import annotations
from .shared import Any, DEFAULT_BODY_COLOR, Pt, XL_LABEL_POSITION, XL_LEGEND_POSITION
from ._component_font_name import _component_font_name
from ._component_semibold_font_name import _component_semibold_font_name
from ._native_chart_has_legend import _native_chart_has_legend
from ._number import _number
from ._number_format import _number_format
from ._rgb import _rgb
from ._series_fallback_color import _series_fallback_color
from ._set_point_colors import _set_point_colors
from ._set_text_font import _set_text_font

def _format_native_chart(chart, component: dict[str, Any], series_meta: list[dict[str, Any]]) -> None:
    props = component.get("props") if isinstance(component.get("props"), dict) else {}
    content = props.get("content") if isinstance(props.get("content"), dict) else {}
    component_type = str(component.get("type") or "")
    font_name = _component_font_name(component)
    semibold_font_name = _component_semibold_font_name(component)
    preserve_component_text = component.get("preserve_component_text") is True
    chart.has_title = bool(str(props.get("title") or "").strip()) and not preserve_component_text
    if chart.has_title:
        chart.chart_title.text_frame.text = str(props.get("title"))
        _set_text_font(
            chart.chart_title.text_frame,
            family=semibold_font_name,
            size=14,
            bold=False,
        )
    chart.has_legend = _native_chart_has_legend(component)
    if chart.has_legend:
        chart.legend.position = XL_LEGEND_POSITION.BOTTOM
        chart.legend.include_in_layout = False
        chart.legend.font.name = font_name
        chart.legend.font.size = Pt(9)
        chart.legend.font.color.rgb = _rgb(DEFAULT_BODY_COLOR)

    try:
        axis = chart.value_axis
    except (AttributeError, ValueError):
        axis = None
    if axis is not None:
        if content.get("minValue") is not None:
            axis.minimum_scale = _number(content.get("minValue"))
        if content.get("maxValue") is not None:
            axis.maximum_scale = _number(content.get("maxValue"))
        if _number(content.get("tickInterval")) > 0:
            axis.major_unit = _number(content.get("tickInterval"))
        axis.has_major_gridlines = True
        axis.tick_labels.font.name = font_name
        axis.tick_labels.font.size = Pt(9)
        axis.tick_labels.font.color.rgb = _rgb(DEFAULT_BODY_COLOR)
    try:
        category_axis = chart.category_axis
    except (AttributeError, ValueError):
        category_axis = None
    if category_axis is not None:
        category_axis.tick_labels.font.name = font_name
        category_axis.tick_labels.font.size = Pt(9)
        category_axis.tick_labels.font.color.rgb = _rgb(DEFAULT_BODY_COLOR)

    for index, series in enumerate(chart.series):
        color = _rgb(
            series_meta[index].get("color"),
            _series_fallback_color(component_type, index),
        )
        if series_meta[index].get("transparent") is True:
            series.format.fill.background()
            series.format.line.fill.background()
        elif hasattr(series.format, "fill"):
            series.format.fill.solid()
            series.format.fill.fore_color.rgb = color
            series.format.line.color.rgb = color
            series.format.line.width = Pt(1.5)
        _set_point_colors(series, series_meta[index].get("point_colors"))
        if hasattr(series, "marker"):
            series.marker.size = 6
            series.marker.format.fill.solid()
            series.marker.format.fill.fore_color.rgb = color
            series.marker.format.line.color.rgb = color

    plot = chart.plots[0]
    if component_type == "grouped-bar-chart":
        plot.gap_width = 48
    elif component_type in {"stacked-bar-chart", "waterfall-chart"}:
        plot.gap_width = 55
        plot.overlap = 100
    elif component_type == "donut-chart":
        hole_ratio = max(0.1, min(0.9, _number(content.get("holeRatio")) or 0.5))
        plot.hole_size = int(round(hole_ratio * 100))

    show_values = (
        component_type in {"grouped-bar-chart", "stacked-bar-chart", "waterfall-chart"}
        and content.get("showValues", True) is not False
    )
    if show_values and component_type == "waterfall-chart":
        plot.has_data_labels = False
        for index, series in enumerate(chart.series):
            if index == 0:
                continue
            labels = series.data_labels
            labels.show_value = True
            labels.show_category_name = False
            labels.show_series_name = False
            labels.show_legend_key = False
            labels.number_format = (
                f'-{_number_format(content)}'
                if series_meta[index].get("name") == "Decrease"
                else _number_format(content)
            )
            labels.number_format_is_linked = False
            labels.position = XL_LABEL_POSITION.CENTER
            labels.font.name = semibold_font_name
            labels.font.size = Pt(9)
            labels.font.bold = False
            labels.font.color.rgb = _rgb("FFFFFF")
    elif show_values and component_type in {"grouped-bar-chart", "stacked-bar-chart"}:
        plot.has_data_labels = True
        labels = plot.data_labels
        labels.show_value = True
        labels.show_category_name = False
        labels.show_series_name = False
        labels.show_legend_key = False
        labels.number_format = _number_format(content)
        labels.number_format_is_linked = False
        labels.position = (
            XL_LABEL_POSITION.OUTSIDE_END
            if component_type == "grouped-bar-chart"
            else XL_LABEL_POSITION.CENTER
        )
        labels.font.name = font_name
        labels.font.size = Pt(9)
        if component_type == "grouped-bar-chart":
            labels.font.color.rgb = _rgb(DEFAULT_BODY_COLOR)

_format_native_chart.__module__ = 'schema_v4_native'
