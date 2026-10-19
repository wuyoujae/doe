# Origin: htmlir_server.py::HtmlIrRequestHandler._send_file
from __future__ import annotations
from doe_export.service.shared import HTTPStatus

def _send_file(self, payload: bytes, content_type: str, filename: str) -> None:
    self.send_response(HTTPStatus.OK)
    self.send_header("Content-Type", content_type)
    self.send_header("Content-Length", str(len(payload)))
    self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
    self.send_header("Cache-Control", "no-store")
    self.send_header("X-Content-Type-Options", "nosniff")
    self.end_headers()
    self.wfile.write(payload)

_send_file.__module__ = 'htmlir_server'
_send_file.__qualname__ = 'HtmlIrRequestHandler._send_file'
