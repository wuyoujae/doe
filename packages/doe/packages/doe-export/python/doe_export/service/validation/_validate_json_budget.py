# Origin: htmlir_server.py::_validate_json_budget
from __future__ import annotations
from doe_export.service.shared import Any, MAX_JSON_DEPTH, MAX_JSON_NODES

def _validate_json_budget(value: Any) -> None:
    nodes = 0
    stack: list[tuple[Any, int]] = [(value, 1)]
    while stack:
        current, depth = stack.pop()
        nodes += 1
        if nodes > MAX_JSON_NODES:
            raise ValueError(f"JSON cannot exceed {MAX_JSON_NODES} values.")
        if depth > MAX_JSON_DEPTH:
            raise ValueError(f"JSON cannot exceed depth {MAX_JSON_DEPTH}.")
        if isinstance(current, dict):
            stack.extend((item, depth + 1) for item in current.values())
        elif isinstance(current, list):
            stack.extend((item, depth + 1) for item in current)

_validate_json_budget.__module__ = 'htmlir_server'
