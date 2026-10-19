# Origin: htmlir_server.py::HtmlIrRequestHandler.do_POST
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import POST_ROUTES
from doe_export.service.shared import urlparse

def do_POST(self) -> None:
    if not self._validate_request_boundary():
        return
    route = urlparse(self.path).path
    if route not in POST_ROUTES:
        self._send_json({"success": False, "error": "Not found"}, HTTPStatus.NOT_FOUND)
        return
    if not self._validate_post_body(route):
        return
    if not self._acquire_request_slot():
        return
    try:
        self._do_post(route)
    finally:
        self._release_request_slot()

do_POST.__module__ = 'htmlir_server'
do_POST.__qualname__ = 'HtmlIrRequestHandler.do_POST'
