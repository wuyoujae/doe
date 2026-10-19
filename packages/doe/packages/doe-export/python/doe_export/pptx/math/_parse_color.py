# Origin: schema_v4_math.py::_parse_color
from __future__ import annotations
from .shared import _HEX_COLOR_RE, _RGB_COLOR_RE

def _parse_color(value: object, default: str = "1B1B27") -> str:
    text = str(value or "")
    match = _HEX_COLOR_RE.search(text)
    if match:
        return match.group(1).upper()
    match = _RGB_COLOR_RE.search(text)
    if match:
        channels = [max(0, min(255, int(item))) for item in match.groups()]
        return "".join(f"{channel:02X}" for channel in channels)
    return default

_parse_color.__module__ = 'schema_v4_math'
