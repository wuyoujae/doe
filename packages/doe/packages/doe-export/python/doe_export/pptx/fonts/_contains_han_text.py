# Origin: schema_v4_fonts.py::_contains_han_text
from __future__ import annotations
from .shared import Any

def _contains_han_text(value: Any) -> bool:
    if isinstance(value, str):
        return any(
            0x3400 <= ord(character) <= 0x4DBF
            or 0x4E00 <= ord(character) <= 0x9FFF
            or 0xF900 <= ord(character) <= 0xFAFF
            or 0x20000 <= ord(character) <= 0x323AF
            for character in value
        )
    if isinstance(value, (list, tuple)):
        return any(_contains_han_text(item) for item in value)
    if isinstance(value, dict):
        return any(_contains_han_text(item) for item in value.values())
    return False

_contains_han_text.__module__ = 'schema_v4_fonts'
