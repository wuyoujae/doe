# Origin: htmlir_server.py::_bounded_int
from __future__ import annotations
from doe_export.service.shared import Any

def _bounded_int(
    payload: dict[str, Any],
    name: str,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    value = int(payload.get(name) or default)
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}.")
    return value

_bounded_int.__module__ = 'htmlir_server'
