# Origin: htmlir_server.py::_json_response
from __future__ import annotations
from doe_export.service.shared import Any, HTTPStatus, json

def _json_response(payload: dict[str, Any], status: int = HTTPStatus.OK) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")

_json_response.__module__ = 'htmlir_server'
