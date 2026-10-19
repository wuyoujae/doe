from __future__ import annotations


from io import BytesIO

import re

from typing import Any, Iterable

from zipfile import ZIP_DEFLATED, ZipFile


from pptx import Presentation

from pptx.chart.data import ChartData

from pptx.dml.color import RGBColor

from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION, XL_LEGEND_POSITION

from pptx.enum.text import PP_ALIGN

from pptx.util import Pt


from schema_v4_math import FORMULA_COMPONENT_TYPE, add_native_formula



EMU_PER_POINT = 12_700

DEFAULT_CHART_COLORS = ("1B54DA", "D2DDF8", "10317F", "1543AD", "4172E7")

DEFAULT_HEADING_COLOR = "1B1B27"

DEFAULT_BODY_COLOR = "404155"

SUPPORTED_CHART_TYPES = {
    "grouped-bar-chart": XL_CHART_TYPE.COLUMN_CLUSTERED,
    "line-chart": XL_CHART_TYPE.LINE_MARKERS,
    "stacked-bar-chart": XL_CHART_TYPE.COLUMN_STACKED,
    "radar-chart": XL_CHART_TYPE.RADAR_MARKERS,
    "donut-chart": XL_CHART_TYPE.DOUGHNUT,
    "waterfall-chart": XL_CHART_TYPE.COLUMN_STACKED,
}

_CHART_AXIS_ID = re.compile(
    rb'(<c:(?:axId|crossAx)\b[^>]*\bval=")(-?\d+)(")'
)



__all__ = ["SUPPORTED_CHART_TYPES", "apply_schema_v4_native_components"]

