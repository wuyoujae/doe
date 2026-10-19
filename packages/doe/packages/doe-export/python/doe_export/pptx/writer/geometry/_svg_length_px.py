# Origin: pptx2html/server/pptx_writer.py::_svg_length_px
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import SVG_LENGTH_RE, math

def _svg_length_px(value: Any) -> float | None:
    if value is None:
        return None
    match = SVG_LENGTH_RE.fullmatch(str(value))
    if not match:
        return None
    number = float(match.group(1))
    if not math.isfinite(number) or number <= 0:
        return None
    unit = (match.group(2) or "px").lower()
    return number * {
        "px": 1.0,
        "pt": 96.0 / 72.0,
        "pc": 16.0,
        "in": 96.0,
        "cm": 96.0 / 2.54,
        "mm": 96.0 / 25.4,
        "q": 96.0 / 101.6,
    }[unit]

_svg_length_px.__module__ = 'pptx2html.server.pptx_writer'
