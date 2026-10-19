# Origin: htmlir_server.py::HtmlIrRequestHandler._send_internal_error
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.shared import sys
from doe_export.service.shared import urlparse

def _send_internal_error(self, error: Exception) -> None:
    sys.stderr.write(f"htmlir-runtime internal error: {type(error).__name__}\n")
    getattr(self.server, "operational_errors").report_exception(
        error,
        error_code="htmlir_runtime_error",
        message="HTMLIR runtime request failed.",
        route=urlparse(self.path).path,
        method=self.command,
        status_code=500,
        context={"operation": "runtime-request"},
    )
    self._send_json(
        {"success": False, "error": "Internal runtime error."},
        HTTPStatus.INTERNAL_SERVER_ERROR,
    )

_send_internal_error.__module__ = 'htmlir_server'
_send_internal_error.__qualname__ = 'HtmlIrRequestHandler._send_internal_error'
