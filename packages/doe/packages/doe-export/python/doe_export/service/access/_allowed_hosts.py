# Origin: htmlir_server.py::_allowed_hosts
from __future__ import annotations
from doe_export.service.shared import ALLOWED_HOSTS_ENV
from doe_export.service.access._normalize_host import _normalize_host

def _allowed_hosts(bind_host: str, explicit_hosts: list[str]) -> frozenset[str]:
    configured = {
        _normalize_host(value)
        for value in explicit_hosts
        if value and value.strip()
    }
    normalized_bind = _normalize_host(bind_host)
    if normalized_bind in {"127.0.0.1", "localhost", "::1"}:
        configured.update({"127.0.0.1", "localhost", "::1"})
    elif normalized_bind not in {"0.0.0.0", "::"}:
        configured.add(normalized_bind)
    if not configured:
        raise ValueError(
            "A wildcard bind requires at least one explicit --allowed-host or "
            f"{ALLOWED_HOSTS_ENV} value."
        )
    return frozenset(configured)

_allowed_hosts.__module__ = 'htmlir_server'
