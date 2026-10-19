# Origin: htmlir_server.py::HtmlIrRequestHandler._read_json
from __future__ import annotations
from doe_export.service.shared import Any
from doe_export.service.validation._validate_json_budget import _validate_json_budget
from doe_export.service.shared import json

def _read_json(self) -> dict[str, Any]:
    raw = self._read_body()
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object.")
    _validate_json_budget(data)
    return data

_read_json.__module__ = 'htmlir_server'
_read_json.__qualname__ = 'HtmlIrRequestHandler._read_json'
