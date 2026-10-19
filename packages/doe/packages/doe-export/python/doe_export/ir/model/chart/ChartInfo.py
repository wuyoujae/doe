from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from doe_export.ir.model.identity import preserve_identity
from doe_export.ir.model.chart.ChartSeries import ChartSeries

@dataclass
@preserve_identity
class ChartInfo:
    """Parsed chart data for fallback rendering."""

    rel_id: Optional[str] = None
    chart_type: Optional[str] = None
    title: Optional[str] = None
    series: list[ChartSeries] = field(default_factory=list)
    value_axis_format: Optional[str] = None
    value_axis_major_unit: Optional[float] = None
    value_axis_min: Optional[float] = None
    value_axis_max: Optional[float] = None
    show_value_labels: Optional[bool] = None
