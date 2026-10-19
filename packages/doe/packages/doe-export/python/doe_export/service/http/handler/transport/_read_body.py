# Origin: htmlir_server.py::HtmlIrRequestHandler._read_body
from __future__ import annotations


def _read_body(self) -> bytes:
    length = getattr(self, "_request_length", 0)
    raw = self.rfile.read(length)
    if len(raw) != length:
        raise ValueError("Request body ended before Content-Length bytes were received.")
    return raw

_read_body.__module__ = 'htmlir_server'
_read_body.__qualname__ = 'HtmlIrRequestHandler._read_body'
