"""Compatibility API for the modular DOE PowerPoint native implementation."""
from __future__ import annotations

from doe_export.pptx.native.shared import (
    BytesIO,
    re,
    Any,
    Iterable,
    ZIP_DEFLATED,
    ZipFile,
    Presentation,
    ChartData,
    RGBColor,
    XL_CHART_TYPE,
    XL_LABEL_POSITION,
    XL_LEGEND_POSITION,
    PP_ALIGN,
    Pt,
    FORMULA_COMPONENT_TYPE,
    add_native_formula,
    EMU_PER_POINT,
    DEFAULT_CHART_COLORS,
    DEFAULT_HEADING_COLOR,
    DEFAULT_BODY_COLOR,
    SUPPORTED_CHART_TYPES,
    _CHART_AXIS_ID,
    __all__,
)
from doe_export.pptx.native._rgb import _rgb
from doe_export.pptx.native._number import _number
from doe_export.pptx.native._contains_han_text import _contains_han_text
from doe_export.pptx.native._component_font_name import _component_font_name
from doe_export.pptx.native._component_semibold_font_name import _component_semibold_font_name
from doe_export.pptx.native._series_fallback_color import _series_fallback_color
from doe_export.pptx.native._chart_data import _chart_data
from doe_export.pptx.native._shape_intersection_ratio import _shape_intersection_ratio
from doe_export.pptx.native._remove_visual_fallback import _remove_visual_fallback
from doe_export.pptx.native._set_text_font import _set_text_font
from doe_export.pptx.native._number_format import _number_format
from doe_export.pptx.native._set_point_colors import _set_point_colors
from doe_export.pptx.native._native_chart_has_legend import _native_chart_has_legend
from doe_export.pptx.native._format_native_chart import _format_native_chart
from doe_export.pptx.native._add_native_chart import _add_native_chart
from doe_export.pptx.native.apply_schema_v4_native_components import apply_schema_v4_native_components
from doe_export.pptx.native._normalize_chart_axis_ids import _normalize_chart_axis_ids
