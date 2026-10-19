# Origin: pptx2html/server/ooxml_pptx_writer.py::build_line_spacing
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shape._line_spacing_percent import _line_spacing_percent
from doe_export.pptx.ooxml.geometry._line_spacing_points import _line_spacing_points

def build_line_spacing(paragraph: dict[str, Any]) -> ET.Element | None:
    spacing_type = paragraph.get("line_spacing_type")
    has_points = paragraph.get("line_spacing_pt") is not None
    has_percent = paragraph.get("line_spacing_multiple") is not None
    if spacing_type == "points" and has_points:
        return _line_spacing_points(paragraph.get("line_spacing_pt"))
    if spacing_type == "percent" and has_percent:
        return _line_spacing_percent(paragraph.get("line_spacing_multiple"))
    if has_points:
        return _line_spacing_points(paragraph.get("line_spacing_pt"))
    if has_percent:
        return _line_spacing_percent(paragraph.get("line_spacing_multiple"))
    return None

build_line_spacing.__module__ = 'pptx2html.server.ooxml_pptx_writer'
