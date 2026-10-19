# Origin: htmlir_server.py::HtmlIrRequestHandler._release_request_slot
from __future__ import annotations


def _release_request_slot(self) -> None:
    getattr(self.server, "request_semaphore").release()

_release_request_slot.__module__ = 'htmlir_server'
_release_request_slot.__qualname__ = 'HtmlIrRequestHandler._release_request_slot'
