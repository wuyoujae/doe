# Origin: pptx_pipeline.py::_scale_table_for_export
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.geometry._scale_border_for_export import _scale_border_for_export
from doe_export.pipeline.assets._scale_fill_image_for_export import _scale_fill_image_for_export
from doe_export.pipeline.geometry._scale_optional_number import _scale_optional_number
from doe_export.pipeline.text_layout._scale_text_frame_for_export import _scale_text_frame_for_export

def _scale_table_for_export(
    table: Any,
    scale_x: float,
    scale_y: float,
    metric_scale: float,
) -> None:
    if not isinstance(table, dict):
        return
    if isinstance(table.get("col_widths"), list):
        table["col_widths"] = [
            float(value) * scale_x
            if isinstance(value, (int, float)) and not isinstance(value, bool)
            else value
            for value in table["col_widths"]
        ]
    if isinstance(table.get("row_heights"), list):
        table["row_heights"] = [
            float(value) * scale_y
            if isinstance(value, (int, float)) and not isinstance(value, bool)
            else value
            for value in table["row_heights"]
        ]
    for row in table.get("rows") or []:
        for cell in row if isinstance(row, list) else []:
            if not isinstance(cell, dict):
                continue
            _scale_text_frame_for_export(
                cell.get("text_frame"), scale_x, scale_y, metric_scale
            )
            for key in ("border_left", "border_right", "border_top", "border_bottom"):
                _scale_border_for_export(cell.get(key), metric_scale)
            margins = cell.get("margins")
            if isinstance(margins, dict):
                for key in ("left", "right"):
                    _scale_optional_number(margins, key, scale_x)
                for key in ("top", "bottom"):
                    _scale_optional_number(margins, key, scale_y)
            _scale_fill_image_for_export(cell.get("fill"), scale_x, scale_y)

_scale_table_for_export.__module__ = 'pptx_pipeline'
