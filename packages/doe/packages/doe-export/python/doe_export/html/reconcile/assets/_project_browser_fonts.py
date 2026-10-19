# Origin: pptx2html/htmlir/reconcile.py::_project_browser_fonts
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, copy
from doe_export.html.reconcile.assets._managed_asset_id import _managed_asset_id
from doe_export.html.reconcile.assets._normalize_browser_asset_overrides import _normalize_browser_asset_overrides
from doe_export.html.reconcile.assets._normalize_browser_asset_suppressions import _normalize_browser_asset_suppressions

def _project_browser_fonts(
    presentation_ir: dict[str, Any],
    asset_overrides: dict[str, str] | None,
    asset_suppressions: list[str] | None,
) -> dict[str, Any]:
    overrides = _normalize_browser_asset_overrides(asset_overrides)
    suppressions = _normalize_browser_asset_suppressions(asset_suppressions)
    projected = copy.deepcopy(presentation_ir)
    fonts = projected.get("embedded_fonts")
    if not isinstance(fonts, list):
        return projected
    retained: list[Any] = []
    for font in fonts:
        if not isinstance(font, dict):
            retained.append(font)
            continue
        value = font.get("data")
        source_id = _managed_asset_id(value)
        if source_id in suppressions:
            continue
        target = overrides.get(source_id or "")
        if target is not None and isinstance(value, str):
            prefix = (
                "yrkie-asset-base64://"
                if value.startswith("yrkie-asset-base64://")
                else "yrkie-asset-data://"
            )
            font["data"] = f"{prefix}{target}"
        retained.append(font)
    projected["embedded_fonts"] = retained
    return projected

_project_browser_fonts.__module__ = 'pptx2html.htmlir.reconcile'
