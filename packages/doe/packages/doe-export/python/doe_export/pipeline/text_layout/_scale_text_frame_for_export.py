# Origin: pptx_pipeline.py::_scale_text_frame_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_font_for_export import _scale_font_for_export
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number

def _scale_text_frame_for_export(
    text: Any,
    scale_x: float,
    scale_y: float,
    metric_scale: float,
) -> None:
    if not isinstance(text, dict):
        return
    margins = text.get("margins")
    if isinstance(margins, dict):
        for key in ("left", "right"):
            _scale_optional_number(margins, key, scale_x)
        for key in ("top", "bottom"):
            _scale_optional_number(margins, key, scale_y)
    _scale_optional_number(text, "baseline_top_offset", scale_y)
    _scale_optional_number(text, "column_spacing", scale_x)
    text["layout_snapshot"] = None
    text["layout_snapshot_dirty"] = True
    for paragraph in text.get("paragraphs") or []:
        if not isinstance(paragraph, dict):
            continue
        for key in (
            "margin_left",
            "margin_right",
            "indent",
            "default_tab_size",
            "line_spacing_pt",
            "spacing_before",
            "spacing_after",
        ):
            _scale_optional_number(paragraph, key, metric_scale)
        bullet = paragraph.get("bullet")
        if isinstance(bullet, dict):
            _scale_optional_number(bullet, "size_pt", metric_scale)
        _scale_font_for_export(paragraph.get("end_para_font"), metric_scale)
        for run in paragraph.get("runs") or []:
            if isinstance(run, dict):
                _scale_font_for_export(run.get("font"), metric_scale)

_scale_text_frame_for_export.__module__ = 'pptx_pipeline'
