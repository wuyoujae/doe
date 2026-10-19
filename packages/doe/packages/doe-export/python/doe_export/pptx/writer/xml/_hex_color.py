# Origin: pptx2html/server/pptx_writer.py::_hex_color
from __future__ import annotations
from doe_export.pptx.writer.shared import RGBColor

def _hex_color(value: str | None):
    if not value:
        return None
    clean = str(value).strip().lstrip("#")
    if len(clean) != 6:
        return None
    try:
        return RGBColor(int(clean[0:2], 16), int(clean[2:4], 16), int(clean[4:6], 16))
    except ValueError:
        return None

_hex_color.__module__ = 'pptx2html.server.pptx_writer'
