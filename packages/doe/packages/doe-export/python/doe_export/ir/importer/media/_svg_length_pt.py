# Origin: pptx2html/ir/builder.py::PresentationBuilder._svg_length_pt
from __future__ import annotations
from doe_export.ir.importer.shared import Optional, re

@classmethod
def _svg_length_pt(cls, value: object, dpi_override: Optional[float]) -> Optional[float]:
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
    number = cls._positive_finite_float(match.group(1))
    if number is None:
        return None
    unit = (match.group(2) or "px").lower()
    factor = {
        "px": 72.0 / (dpi_override or 96.0),
        "pt": 1.0,
        "pc": 12.0,
        "in": 72.0,
        "cm": 72.0 / 2.54,
        "mm": 72.0 / 25.4,
        "q": 72.0 / 101.6,
    }[unit]
    return number * factor

_svg_length_pt.__func__.__module__ = 'pptx2html.ir.builder'
_svg_length_pt.__func__.__qualname__ = 'PresentationBuilder._svg_length_pt'
