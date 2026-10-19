# Origin: schema_v4_native.py::_number
from __future__ import annotations
from .shared import Any

def _number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0

_number.__module__ = 'schema_v4_native'
