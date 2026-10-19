# Origin: pptx2html/server/pptx_writer.py::_svg_view_box
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import math, re

def _svg_view_box(value: Any) -> tuple[float, float] | None:
    if value is None:
        return None
    try:
        parts = [float(part) for part in re.split(r"[\s,]+", str(value).strip()) if part]
    except ValueError:
        return None
    if len(parts) != 4 or not all(math.isfinite(part) for part in parts):
        return None
    width, height = parts[2], parts[3]
    return (width, height) if width > 0 and height > 0 else None

_svg_view_box.__module__ = 'pptx2html.server.pptx_writer'
