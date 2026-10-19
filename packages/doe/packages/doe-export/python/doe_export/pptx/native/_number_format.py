# Origin: schema_v4_native.py::_number_format
from __future__ import annotations
from .shared import Any

def _number_format(content: dict[str, Any]) -> str:
    prefix = str(content.get("valuePrefix") or "").replace('"', '""')
    suffix = str(content.get("valueSuffix") or "").replace('"', '""')
    return f'"{prefix}"0"{suffix}"' if prefix or suffix else "0"

_number_format.__module__ = 'schema_v4_native'
