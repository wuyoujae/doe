# Origin: pptx2html/ir/builder.py::PresentationBuilder._is_bounded_svg_view_box
from __future__ import annotations
from doe_export.ir.importer.shared import _EMF2SVG_MAX_COORDINATE, math, re

@staticmethod
def _is_bounded_svg_view_box(value: str) -> bool:
    parts = [part for part in re.split(r"[\s,]+", value.strip()) if part]
    if len(parts) != 4:
        return False
    try:
        numbers = [float(part) for part in parts]
    except ValueError:
        return False
    return (
        all(math.isfinite(number) and abs(number) <= _EMF2SVG_MAX_COORDINATE for number in numbers)
        and numbers[2] > 0
        and numbers[3] > 0
    )

_is_bounded_svg_view_box.__func__.__module__ = 'pptx2html.ir.builder'
_is_bounded_svg_view_box.__func__.__qualname__ = 'PresentationBuilder._is_bounded_svg_view_box'
