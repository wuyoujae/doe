# Origin: pptx2html/htmlir/reconcile.py::_managed_asset_id
from __future__ import annotations
from doe_export.html.reconcile.shared import Any

def _managed_asset_id(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    for prefix in ("yrkie-asset-data://", "yrkie-asset-base64://"):
        if value.startswith(prefix):
            candidate = value[len(prefix) :]
            if len(candidate) == 64 and all(
                character in "0123456789abcdefABCDEF" for character in candidate
            ):
                return candidate.lower()
    return None

_managed_asset_id.__module__ = 'pptx2html.htmlir.reconcile'
