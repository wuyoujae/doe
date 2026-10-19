# Origin: pptx2html/ir/builder.py::PresentationBuilder._has_bounded_svg_numbers
from __future__ import annotations
from doe_export.ir.importer.shared import _EMF2SVG_MAX_COORDINATE, _EMF2SVG_NUMBER_PATTERN, math, re

@staticmethod
def _has_bounded_svg_numbers(value: str) -> bool:
    if re.search(r"(?:^|[^A-Za-z])(?:nan|inf(?:inity)?)(?:$|[^A-Za-z])", value, re.IGNORECASE):
        return False
    for raw_number in _EMF2SVG_NUMBER_PATTERN.findall(value):
        try:
            number = float(raw_number)
        except ValueError:
            return False
        if not math.isfinite(number) or abs(number) > _EMF2SVG_MAX_COORDINATE:
            return False
    return True

_has_bounded_svg_numbers.__func__.__module__ = 'pptx2html.ir.builder'
_has_bounded_svg_numbers.__func__.__qualname__ = 'PresentationBuilder._has_bounded_svg_numbers'
