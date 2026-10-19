# Origin: htmlir_server.py::HtmlIrRequestHandler._send_json
from __future__ import annotations
from doe_export.service.shared import Any
from doe_export.service.shared import HTTPStatus
from doe_export.service.validation._json_response import _json_response

def _send_json(
    self,
    payload: dict[str, Any],
    status: int = HTTPStatus.OK,
    *,
    extra_headers: dict[str, str] | None = None,
) -> None:
    body = _json_response(payload, status)
    self.send_response(int(status))
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(body)))
    self.send_header("Cache-Control", "no-store")
    self.send_header("X-Content-Type-Options", "nosniff")
    for name, value in (extra_headers or {}).items():
        self.send_header(name, value)
    self.end_headers()
    if self.command != "HEAD":
        self.wfile.write(body)

_send_json.__module__ = 'htmlir_server'
_send_json.__qualname__ = 'HtmlIrRequestHandler._send_json'
