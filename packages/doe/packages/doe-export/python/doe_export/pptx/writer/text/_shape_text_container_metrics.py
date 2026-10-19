# Origin: pptx2html/server/pptx_writer.py::_shape_text_container_metrics
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.text._text_container_metrics import _text_container_metrics

def _shape_text_container_metrics(
    shape: dict[str, Any],
    width_pt: Any,
    height_pt: Any,
) -> dict[str, Any] | None:
    text_rect = shape.get("text_rect") or {}
    if text_rect:
        try:
            left = float(text_rect.get("left"))
            right = float(text_rect.get("right"))
            top = float(text_rect.get("top"))
            bottom = float(text_rect.get("bottom"))
            width_pt = float(width_pt) * (right - left) / 100.0
            height_pt = float(height_pt) * (bottom - top) / 100.0
        except (TypeError, ValueError):
            return None
    return _text_container_metrics(width_pt, height_pt)

_shape_text_container_metrics.__module__ = 'pptx2html.server.pptx_writer'
