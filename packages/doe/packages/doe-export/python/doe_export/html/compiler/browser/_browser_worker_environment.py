# Origin: pptx2html/htmlir/compiler.py::_browser_worker_environment
from __future__ import annotations
from doe_export.html.compiler.shared import _BROWSER_ENV_ALLOWLIST, os

def _browser_worker_environment() -> dict[str, str] | None:
    strict = os.environ.get("YRKIE_HTMLIR_SANITIZE_BROWSER_ENV", "").strip().lower()
    if strict not in {"1", "true", "yes"}:
        return None
    environment = {
        name: value
        for name, value in os.environ.items()
        if name.upper() in _BROWSER_ENV_ALLOWLIST
    }
    environment.setdefault("PATH", os.defpath)
    return environment

_browser_worker_environment.__module__ = 'pptx2html.htmlir.compiler'
