# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._chart_fallback
from __future__ import annotations
from doe_export.html.renderer.shared import Shape, html, math

def _chart_fallback(self, shape: Shape) -> str:
    chart = shape.chart
    if not chart or not chart.series:
        return self._chart_placeholder(shape)
    numeric_series = []
    for series in chart.series:
        points = []
        for raw in series.values:
            try:
                value = float(raw)
            except (TypeError, ValueError):
                continue
            if math.isfinite(value):
                points.append(value)
        if points:
            numeric_series.append((series, points))
    if not numeric_series:
        return self._chart_placeholder(shape)

    width = max(1.0, shape.bounds.width if shape.bounds else 320.0)
    height = max(1.0, shape.bounds.height if shape.bounds else 180.0)
    title_height = 32.0 if chart.title else 18.0
    plot_top = max(title_height, height * 0.08)
    plot_left = min(72.0, max(42.0, width * 0.16))
    plot_right = min(32.0, max(18.0, width * 0.06))
    plot_bottom = min(86.0, max(54.0, height * 0.20))
    plot_width = max(1.0, width - plot_left - plot_right)
    plot_height = max(1.0, height - plot_top - plot_bottom)

    values = [value for _, points in numeric_series for value in points]
    axis_min = chart.value_axis_min if chart.value_axis_min is not None else min(0.0, *values)
    if chart.value_axis_max is not None:
        axis_max = max(axis_min + 0.000001, chart.value_axis_max)
    else:
        max_value = max(0.0, *values)
        first_step = self._nice_chart_step(max(0.000001, max_value - axis_min))
        axis_max = max(axis_min + first_step, math.ceil(max_value / first_step) * first_step)
    span = max(0.000001, axis_max - axis_min)
    tick_step = (
        chart.value_axis_major_unit
        if chart.value_axis_major_unit is not None and chart.value_axis_major_unit > 0
        else self._nice_chart_step(span)
    )
    percent = self._chart_uses_percent(chart, numeric_series)
    ticks = self._chart_ticks(axis_min, axis_max, tick_step)
    palette = ("176d88", "d97706", "4f46e5", "15803d", "be123c")

    def y_for(value: float) -> float:
        return plot_top + plot_height - ((value - axis_min) / span) * plot_height

    svg = [
        f'<svg class="pptx-chart-svg" viewBox="0 0 {width:.4f} {height:.4f}" '
        'width="100%" height="100%" preserveAspectRatio="none" '
        'xmlns="http://www.w3.org/2000/svg" role="img">'
    ]
    if chart.title:
        svg.append(
            f'<text x="{width / 2:.4f}" y="20" text-anchor="middle" '
            'fill="#FFFFFF" font-family="SimSun,Times New Roman,serif" '
            f'font-size="15" font-weight="700">{html.escape(chart.title)}</text>'
        )
    for tick in ticks:
        y = y_for(tick)
        label = self._format_chart_value(tick, chart.value_axis_format, percent)
        svg.append(
            f'<line x1="{plot_left:.4f}" y1="{y:.4f}" '
            f'x2="{plot_left + plot_width:.4f}" y2="{y:.4f}" '
            'stroke="#FFFFFF" stroke-opacity="0.82" stroke-width="0.8"/>'
        )
        svg.append(
            f'<text x="{plot_left - 10:.4f}" y="{y:.4f}" text-anchor="end" '
            'dominant-baseline="middle" fill="#FFFFFF" '
            'font-family="SimSun,Times New Roman,serif" font-size="9" font-weight="700">'
            f'{html.escape(label)}</text>'
        )
    svg.append(
        f'<path d="M {plot_left:.4f} {plot_top:.4f} '
        f'L {plot_left:.4f} {plot_top + plot_height:.4f} '
        f'L {plot_left + plot_width:.4f} {plot_top + plot_height:.4f}" '
        'fill="none" stroke="#FFFFFF" stroke-opacity="0.82" stroke-width="0.8"/>'
    )

    chart_type = (chart.chart_type or "").lower()
    if "line" in chart_type:
        for series_index, (series, points) in enumerate(numeric_series):
            color = self._css_color(series.color) or f"#{palette[series_index % len(palette)]}"
            coords = " ".join(
                f"{plot_left + (0 if len(points) <= 1 else plot_width * index / (len(points) - 1)):.4f},"
                f"{y_for(value):.4f}"
                for index, value in enumerate(points)
            )
            svg.append(
                f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="2"/>'
            )
    else:
        category_count = max(len(points) for _, points in numeric_series)
        group_width = plot_width / max(1, category_count)
        bar_width = max(1.0, group_width * 0.42 / max(1, len(numeric_series)))
        zero_y = y_for(max(axis_min, min(axis_max, 0.0)))
        for series_index, (series, points) in enumerate(numeric_series):
            color = self._css_color(series.color) or f"#{palette[series_index % len(palette)]}"
            for index, value in enumerate(points):
                x = (
                    plot_left
                    + group_width * index
                    + (group_width - bar_width * len(numeric_series)) / 2
                    + bar_width * series_index
                )
                y = y_for(value)
                svg.append(
                    f'<rect x="{x:.4f}" y="{min(y, zero_y):.4f}" '
                    f'width="{bar_width:.4f}" height="{max(0.5, abs(zero_y - y)):.4f}" '
                    f'fill="{color}"/>'
                )
                show_value = (
                    series.show_value_labels
                    if series.show_value_labels is not None
                    else bool(chart.show_value_labels)
                )
                if show_value:
                    label = self._format_chart_value(
                        value, series.value_format or chart.value_axis_format, percent
                    )
                    svg.append(
                        f'<text x="{x + bar_width / 2:.4f}" y="{y - 8:.4f}" '
                        'text-anchor="middle" fill="#FFFFFF" '
                        'font-family="SimSun,Times New Roman,serif" font-size="9" font-weight="700">'
                        f'{html.escape(label)}</text>'
                    )
        categories = next(
            (series.categories for series, _ in numeric_series if series.categories), []
        )
        for index in range(category_count):
            category = categories[index] if index < len(categories) else str(index + 1)
            x = plot_left + group_width * index + group_width / 2
            y = plot_top + plot_height + 15
            svg.append(
                f'<text x="{x:.4f}" y="{y:.4f}" text-anchor="end" '
                f'transform="rotate(-45 {x:.4f} {y:.4f})" fill="#FFFFFF" '
                'font-family="SimSun,Times New Roman,serif" font-size="8.5" font-weight="700">'
                f'{html.escape(str(category))}</text>'
            )
    svg.append("</svg>")
    return "".join(svg)

_chart_fallback.__module__ = 'pptx2html.renderer.html_renderer'
_chart_fallback.__qualname__ = 'HtmlRenderer._chart_fallback'
