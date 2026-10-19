# Origin: htmlir_server.py::HtmlIrRequestHandler.do_OPTIONS
from __future__ import annotations
from doe_export.service.shared import HTTPStatus

def do_OPTIONS(self) -> None:
    if not self._validate_request_boundary():
        return
    self._send_json(
        {"success": False, "error": "CORS requests are not supported."},
        HTTPStatus.METHOD_NOT_ALLOWED,
    )

do_OPTIONS.__module__ = 'htmlir_server'
do_OPTIONS.__qualname__ = 'HtmlIrRequestHandler.do_OPTIONS'
