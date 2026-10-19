# Origin: htmlir_server.py::HtmlIrRequestHandler._validate_request_boundary
from __future__ import annotations
from doe_export.service.shared import HTTPStatus
from doe_export.service.access._normalize_host import _normalize_host
from doe_export.service.shared import hmac

def _validate_request_boundary(self) -> bool:
    host_headers = self.headers.get_all("Host") or []
    if len(host_headers) != 1:
        self._send_json(
            {"success": False, "error": "A single valid Host header is required."},
            HTTPStatus.BAD_REQUEST,
        )
        return False
    try:
        request_host = _normalize_host(host_headers[0])
    except ValueError:
        self._send_json(
            {"success": False, "error": "A single valid Host header is required."},
            HTTPStatus.BAD_REQUEST,
        )
        return False
    allowed_hosts = getattr(self.server, "allowed_hosts")
    if request_host not in allowed_hosts:
        self._send_json(
            {"success": False, "error": "Host is not allowed."},
            HTTPStatus.BAD_REQUEST,
        )
        return False
    authorization_headers = self.headers.get_all("Authorization") or []
    authorization = authorization_headers[0] if len(authorization_headers) == 1 else ""
    scheme, separator, supplied_token = authorization.partition(" ")
    expected_token = getattr(self.server, "runtime_token")
    if (
        not separator
        or scheme.lower() != "bearer"
        or not hmac.compare_digest(supplied_token, expected_token)
    ):
        self._send_json(
            {"success": False, "error": "Unauthorized."},
            HTTPStatus.UNAUTHORIZED,
            extra_headers={"WWW-Authenticate": "Bearer"},
        )
        return False
    if self.headers.get_all("Origin"):
        self._send_json(
            {"success": False, "error": "Browser-originated requests are not allowed."},
            HTTPStatus.FORBIDDEN,
        )
        return False
    return True

_validate_request_boundary.__module__ = 'htmlir_server'
_validate_request_boundary.__qualname__ = 'HtmlIrRequestHandler._validate_request_boundary'
