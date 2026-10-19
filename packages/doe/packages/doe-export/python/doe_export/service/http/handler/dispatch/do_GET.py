# Origin: htmlir_server.py::HtmlIrRequestHandler.do_GET
from __future__ import annotations


def do_GET(self) -> None:
    if not self._validate_request_boundary():
        return
    if not self._acquire_request_slot():
        return
    try:
        self._do_get()
    finally:
        self._release_request_slot()

do_GET.__module__ = 'htmlir_server'
do_GET.__qualname__ = 'HtmlIrRequestHandler.do_GET'
