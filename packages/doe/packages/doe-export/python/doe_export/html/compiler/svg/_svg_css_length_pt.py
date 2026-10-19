# Origin: pptx2html/htmlir/compiler.py::_svg_css_length_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import CSS_PX_TO_PT, re
from doe_export.html.compiler.document._positive_finite_number import _positive_finite_number

def _svg_css_length_pt(value: Any) -> float | None:
    if value is None:
        return None
    match = re.fullmatch(
        r"\s*([+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)\s*"
        r"(px|pt|pc|in|cm|mm|q)?\s*",
        str(value),
        flags=re.IGNORECASE,
    )
    if match is None:
        return None
    number = _positive_finite_number(match.group(1))
    if number is None:
        return None
    return number * {
        "px": CSS_PX_TO_PT,
        "pt": 1.0,
        "pc": 12.0,
        "in": 72.0,
        "cm": 72.0 / 2.54,
        "mm": 72.0 / 25.4,
        "q": 72.0 / 101.6,
    }[(match.group(2) or "px").lower()]

_svg_css_length_pt.__module__ = 'pptx2html.htmlir.compiler'
