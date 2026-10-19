# Origin: pptx_pipeline.py::_scale_font_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number
from doe_export.pipeline.geometry._scale_shadow_for_export import _scale_shadow_for_export

def _scale_font_for_export(font: Any, metric_scale: float) -> None:
    if not isinstance(font, dict):
        return
    for key in (
        "size_pt",
        "underline_width_pt",
        "strike_width_pt",
        "char_spacing_pt",
        "word_spacing_pt",
        "kerning_pt",
    ):
        _scale_optional_number(font, key, metric_scale)
    _scale_shadow_for_export(
        font.get("shadow"), metric_scale, metric_scale, metric_scale
    )

_scale_font_for_export.__module__ = 'pptx_pipeline'
