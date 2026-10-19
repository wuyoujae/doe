# Origin: schema_v4_fonts.py::_next_number
from __future__ import annotations
from .shared import Iterable, re

def _next_number(values: Iterable[str], pattern: str) -> int:
    expression = re.compile(f"^{pattern}$")
    numbers = []
    for value in values:
        if match := expression.match(value):
            numbers.append(int(match.group(1)))
    return max(numbers, default=0) + 1

_next_number.__module__ = 'schema_v4_fonts'
