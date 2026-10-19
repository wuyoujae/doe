# Origin: pptx2html/server/ooxml_pptx_writer.py::is_text_box
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def is_text_box(shape: dict[str, Any]) -> bool:
    fill = shape.get("fill") or {}
    border = shape.get("border") or {}
    return bool(shape.get("text")) and (fill.get("type") == "none" or border.get("no_fill"))

is_text_box.__module__ = 'pptx2html.server.ooxml_pptx_writer'
