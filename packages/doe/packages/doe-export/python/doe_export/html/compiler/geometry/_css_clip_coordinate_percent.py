# Origin: pptx2html/htmlir/compiler.py::_css_clip_coordinate_percent
from __future__ import annotations
from doe_export.html.compiler.shared import CSS_PX_TO_PT, re

def _css_clip_coordinate_percent(raw: str, basis_px: float) -> float | None:
    value = str(raw or "").strip().lower()
    keyword_values = {
        "left": 0.0,
        "top": 0.0,
        "center": 50.0,
        "right": 100.0,
        "bottom": 100.0,
    }
    if value in keyword_values:
        return keyword_values[value]
    if value.startswith("calc(") and value.endswith(")"):
        value = value[5:-1].strip()
    if not value or basis_px <= 0:
        return None

    cursor = 0
    resolved_px = 0.0
    matched = False
    term_pattern = re.compile(
        r"\s*([+-]?)\s*([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)\s*(%|px|pt)?",
        re.IGNORECASE,
    )
    while cursor < len(value):
        match = term_pattern.match(value, cursor)
        if match is None or match.end() == cursor:
            return None
        sign = -1.0 if match.group(1) == "-" else 1.0
        number = float(match.group(2))
        unit = (match.group(3) or "px").lower()
        if unit == "%":
            resolved_px += sign * basis_px * number / 100.0
        elif unit == "pt":
            resolved_px += sign * number / CSS_PX_TO_PT
        else:
            resolved_px += sign * number
        matched = True
        cursor = match.end()
    return 100.0 * resolved_px / basis_px if matched else None

_css_clip_coordinate_percent.__module__ = 'pptx2html.htmlir.compiler'
