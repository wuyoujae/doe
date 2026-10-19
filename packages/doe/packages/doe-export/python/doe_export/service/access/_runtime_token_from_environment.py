# Origin: htmlir_server.py::_runtime_token_from_environment
from __future__ import annotations
from doe_export.service.shared import MIN_RUNTIME_TOKEN_BYTES, RUNTIME_TOKEN_ENV, os

def _runtime_token_from_environment() -> str:
    token = os.environ.get(RUNTIME_TOKEN_ENV, "").strip()
    if len(token.encode("utf-8")) < MIN_RUNTIME_TOKEN_BYTES:
        raise ValueError(f"{RUNTIME_TOKEN_ENV} must contain at least 32 bytes.")
    return token

_runtime_token_from_environment.__module__ = 'htmlir_server'
