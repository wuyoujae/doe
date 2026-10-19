# Origin: pptx2html/htmlir/compiler.py::_css_rgb_channel
from __future__ import annotations

def _css_rgb_channel(value: str, *, unit_interval: bool = False) -> int:
    raw = str(value or "").strip().lower()
    if raw == "none":
        return 0
    try:
        if raw.endswith("%"):
            channel = float(raw[:-1]) * 2.55
        else:
            number = float(raw)
            channel = number * 255.0 if unit_interval and -1.0 <= number <= 1.0 else number
    except ValueError:
        channel = 0.0
    return max(0, min(255, round(channel)))

_css_rgb_channel.__module__ = 'pptx2html.htmlir.compiler'
