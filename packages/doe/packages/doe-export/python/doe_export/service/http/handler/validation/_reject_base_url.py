# Origin: htmlir_server.py::HtmlIrRequestHandler._reject_base_url
from __future__ import annotations
from doe_export.service.shared import Any

def _reject_base_url(self, payload: dict[str, Any]) -> None:
    if payload.get("base_url") not in (None, ""):
        raise ValueError("base_url is not accepted by the HTTP API.")

_reject_base_url.__module__ = 'htmlir_server'
_reject_base_url.__qualname__ = 'HtmlIrRequestHandler._reject_base_url'
