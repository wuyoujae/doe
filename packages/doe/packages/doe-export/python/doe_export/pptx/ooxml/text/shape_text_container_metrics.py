# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_text_container_metrics
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.text._make_text_container_metrics import _make_text_container_metrics
from doe_export.pptx.ooxml.xml.finite_number import finite_number

def shape_text_container_metrics(shape: dict[str, Any]) -> dict[str, Any] | None:
    bounds = shape.get("bounds") or {}
    width = finite_number(bounds.get("width"))
    height = finite_number(bounds.get("height"))
    text_rect = shape.get("text_rect") or {}
    if text_rect:
        left = finite_number(text_rect.get("left"))
        top = finite_number(text_rect.get("top"))
        right = finite_number(text_rect.get("right"))
        bottom = finite_number(text_rect.get("bottom"))
        width *= (right - left) / 100.0
        height *= (bottom - top) / 100.0
    return _make_text_container_metrics(width, height)

shape_text_container_metrics.__module__ = 'pptx2html.server.ooxml_pptx_writer'
