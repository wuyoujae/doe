# Origin: schema_v4_native.py::_rgb
from __future__ import annotations
from .shared import Any, RGBColor

def _rgb(value: Any, fallback: str = "203754") -> RGBColor:
    normalized = str(value or fallback).strip().lstrip("#")
    if len(normalized) == 3:
        normalized = "".join(character * 2 for character in normalized)
    try:
        if len(normalized) != 6:
            raise ValueError
        return RGBColor.from_string(normalized.upper())
    except ValueError:
        return RGBColor.from_string(fallback)

_rgb.__module__ = 'schema_v4_native'
