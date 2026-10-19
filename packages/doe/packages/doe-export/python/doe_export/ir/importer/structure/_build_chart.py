# Origin: pptx2html/ir/builder.py::PresentationBuilder._build_chart
from __future__ import annotations
from doe_export.ir.importer.shared import ChartInfo, ChartSeries, GraphicFrame, NAMESPACE, Optional, local_name

def _build_chart(self, shape: GraphicFrame) -> Optional[ChartInfo]:
    r_id = shape.chart_r_id
    info = ChartInfo(rel_id=r_id)
    if not r_id:
        return info

    chart_part = self._related_part_by_id(shape, r_id)
    chart_space = getattr(chart_part, "element", None)
    if chart_space is None:
        return info

    _C = NAMESPACE.DML_CHART
    chart = chart_space.find(f".//{{{_C}}}chart")
    if chart is None:
        return info

    info.title = self._chart_title(chart)
    plot_area = chart.find(f"{{{_C}}}plotArea")
    if plot_area is None:
        return info

    chart_elem = self._first_chart_element(plot_area)
    if chart_elem is None:
        return info

    chart_type = local_name(chart_elem.tag)
    info.chart_type = chart_type[:-5] if chart_type.endswith("Chart") else chart_type
    val_axis = plot_area.find(f"{{{_C}}}valAx")
    if val_axis is not None:
        info.value_axis_format = self._chart_num_format(val_axis)
        info.value_axis_major_unit = self._optional_float(
            self._chart_child_attr(val_axis, "majorUnit", "val")
        )
        scaling = val_axis.find(f"{{{_C}}}scaling")
        if scaling is not None:
            info.value_axis_min = self._optional_float(
                self._chart_child_attr(scaling, "min", "val")
            )
            info.value_axis_max = self._optional_float(
                self._chart_child_attr(scaling, "max", "val")
            )

    chart_label_format = self._chart_data_label_format(chart_elem)
    info.show_value_labels = self._chart_show_value_labels(chart_elem)

    for ser in chart_elem.findall(f"{{{_C}}}ser"):
        name_values = self._chart_values(ser.find(f"{{{_C}}}tx"))
        series_label_format = self._chart_data_label_format(ser) or chart_label_format
        series_show_value_labels = self._chart_show_value_labels(ser)
        info.series.append(
            ChartSeries(
                name=name_values[0] if name_values else "",
                categories=self._chart_values(ser.find(f"{{{_C}}}cat")),
                values=self._chart_values(ser.find(f"{{{_C}}}val")),
                color=self._chart_series_color(ser),
                value_format=series_label_format,
                show_value_labels=(
                    series_show_value_labels
                    if series_show_value_labels is not None
                    else info.show_value_labels
                ),
            )
        )

    return info

_build_chart.__module__ = 'pptx2html.ir.builder'
_build_chart.__qualname__ = 'PresentationBuilder._build_chart'
