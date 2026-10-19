# Origin: htmlir_server.py::_normalize_host
from __future__ import annotations
from doe_export.service.shared import ipaddress, urlparse

def _normalize_host(value: str) -> str:
    raw = value.strip()
    if not raw or any(character.isspace() for character in raw) or any(
        marker in raw for marker in ("@", "/", "\\")
    ):
        raise ValueError("Invalid allowed host.")
    if raw.count(":") >= 2 and not raw.startswith("["):
        try:
            return str(ipaddress.ip_address(raw)).lower()
        except ValueError as error:
            raise ValueError("Invalid allowed host.") from error
    parsed = urlparse(f"//{raw}")
    if parsed.hostname is None:
        raise ValueError("Invalid allowed host.")
    return parsed.hostname.rstrip(".").lower()

_normalize_host.__module__ = 'htmlir_server'
