# Origin: pptx_pipeline.py::_apply_browser_asset_overrides_to_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import copy

def _apply_browser_asset_overrides_to_ir(
    presentation_ir: dict[str, Any],
    browser_asset_overrides: dict[str, str] | None,
    browser_asset_suppressions: list[str] | None,
) -> dict[str, Any]:
    if browser_asset_overrides is None and browser_asset_suppressions is None:
        return copy.deepcopy(presentation_ir)
    if browser_asset_overrides is None:
        browser_asset_overrides = {}
    if not isinstance(browser_asset_overrides, dict):
        raise ValueError("browser_asset_overrides must be an object.")
    normalized: dict[str, str] = {}
    for source, target in browser_asset_overrides.items():
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
    suppressions: set[str] = set()
    if browser_asset_suppressions is not None:
        if not isinstance(browser_asset_suppressions, list):
            raise ValueError("browser_asset_suppressions must be an array.")
        for asset_id in browser_asset_suppressions:
            if (
                not isinstance(asset_id, str)
                or len(asset_id) != 64
                or any(
                    character not in "0123456789abcdefABCDEF"
                    for character in asset_id
                )
            ):
                raise ValueError(
                    "browser_asset_suppressions must contain SHA-256 asset ids."
                )
            suppressions.add(asset_id.lower())
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
        if not isinstance(value, str):
            retained.append(font)
            continue
        for prefix in ("yrkie-asset-data://", "yrkie-asset-base64://"):
            if not value.startswith(prefix):
                continue
            source_id = value[len(prefix) :].lower()
            if source_id in suppressions:
                break
            target_id = normalized.get(source_id)
            if target_id is not None:
                font["data"] = f"{prefix}{target_id}"
            break
        else:
            retained.append(font)
            continue
        if source_id not in suppressions:
            retained.append(font)
    projected["embedded_fonts"] = retained
    return projected

_apply_browser_asset_overrides_to_ir.__module__ = 'pptx_pipeline'
