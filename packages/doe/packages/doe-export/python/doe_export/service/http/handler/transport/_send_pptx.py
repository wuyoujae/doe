# Origin: htmlir_server.py::HtmlIrRequestHandler._send_pptx
from __future__ import annotations


def _send_pptx(self, payload: bytes, filename: str) -> None:
    self._send_file(
        payload,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename,
    )

_send_pptx.__module__ = 'htmlir_server'
_send_pptx.__qualname__ = 'HtmlIrRequestHandler._send_pptx'
