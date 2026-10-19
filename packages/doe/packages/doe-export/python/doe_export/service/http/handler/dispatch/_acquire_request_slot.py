# Origin: htmlir_server.py::HtmlIrRequestHandler._acquire_request_slot
from __future__ import annotations
from doe_export.service.shared import HTTPStatus

def _acquire_request_slot(self) -> bool:
    semaphore = getattr(self.server, "request_semaphore")
    if semaphore.acquire(blocking=False):
        return True
    self._send_json(
        {"success": False, "error": "The runtime is at its concurrency limit."},
        HTTPStatus.TOO_MANY_REQUESTS,
        extra_headers={"Retry-After": "1"},
    )
    return False

_acquire_request_slot.__module__ = 'htmlir_server'
_acquire_request_slot.__qualname__ = 'HtmlIrRequestHandler._acquire_request_slot'
