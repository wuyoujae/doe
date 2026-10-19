# Origin: pptx_pipeline.py::_svg_css_is_unsafe
from __future__ import annotations
from doe_export.pipeline.shared import _SAFE_RASTER_DATA_URL_PATTERN, _SVG_CSS_URL_PATTERN, re

def _svg_css_is_unsafe(value: str) -> bool:
    if re.search(r"(?:@import|expression\s*\(|javascript:)", value, re.IGNORECASE):
        return True
    for match in _SVG_CSS_URL_PATTERN.finditer(value):
        target = match.group("value").strip()
        if target.startswith("#") or _SAFE_RASTER_DATA_URL_PATTERN.fullmatch(target):
            continue
        return True
    return False

_svg_css_is_unsafe.__module__ = 'pptx_pipeline'
