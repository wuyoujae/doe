# Origin: pptx2html/htmlir/reconcile.py::_normalize_browser_asset_overrides
from __future__ import annotations

def _normalize_browser_asset_overrides(
    value: dict[str, str] | None,
) -> dict[str, str]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError("browser_asset_overrides must be an object.")
    normalized: dict[str, str] = {}
    for source, target in value.items():
        if (
            not isinstance(source, str)
            or not isinstance(target, str)
            or len(source) != 64
            or len(target) != 64
            or any(character not in "0123456789abcdefABCDEF" for character in source)
            or any(character not in "0123456789abcdefABCDEF" for character in target)
        ):
            raise ValueError(
                "browser_asset_overrides keys and values must be SHA-256 asset ids."
            )
        normalized[source.lower()] = target.lower()
    return normalized

_normalize_browser_asset_overrides.__module__ = 'pptx2html.htmlir.reconcile'
