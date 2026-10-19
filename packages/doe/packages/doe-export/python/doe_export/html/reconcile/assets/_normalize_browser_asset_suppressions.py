# Origin: pptx2html/htmlir/reconcile.py::_normalize_browser_asset_suppressions
from __future__ import annotations

def _normalize_browser_asset_suppressions(value: list[str] | None) -> set[str]:
    if value is None:
        return set()
    if not isinstance(value, list):
        raise ValueError("browser_asset_suppressions must be an array.")
    normalized: set[str] = set()
    for asset_id in value:
        if (
            not isinstance(asset_id, str)
            or len(asset_id) != 64
            or any(character not in "0123456789abcdefABCDEF" for character in asset_id)
        ):
            raise ValueError(
                "browser_asset_suppressions must contain SHA-256 asset ids."
            )
        normalized.add(asset_id.lower())
    return normalized

_normalize_browser_asset_suppressions.__module__ = 'pptx2html.htmlir.reconcile'
