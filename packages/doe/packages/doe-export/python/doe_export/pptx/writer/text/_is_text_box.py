# Origin: pptx2html/server/pptx_writer.py::_is_text_box
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _is_text_box(shape: dict[str, Any], text_frame: dict[str, Any] | None) -> bool:
    border = shape.get("border") or {}
    fill = shape.get("fill") or {}
    return bool(text_frame) and (border.get("no_fill") or fill.get("type") == "none")

_is_text_box.__module__ = 'pptx2html.server.pptx_writer'
