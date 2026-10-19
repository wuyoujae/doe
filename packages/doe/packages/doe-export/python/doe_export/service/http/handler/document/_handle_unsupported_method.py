# Origin: htmlir_server.py::HtmlIrRequestHandler._handle_unsupported_method
from __future__ import annotations
from doe_export.service.shared import HTTPStatus

def _handle_unsupported_method(self) -> None:
    if not self._validate_request_boundary():
        return
    self._send_json(
        {"success": False, "error": "Method not allowed."},
        HTTPStatus.METHOD_NOT_ALLOWED,
        extra_headers={"Allow": "GET, POST"},
    )

_handle_unsupported_method.__module__ = 'htmlir_server'
_handle_unsupported_method.__qualname__ = 'HtmlIrRequestHandler._handle_unsupported_method'
