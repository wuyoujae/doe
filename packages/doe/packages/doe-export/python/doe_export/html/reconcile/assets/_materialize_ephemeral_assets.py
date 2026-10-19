# Origin: pptx2html/htmlir/reconcile.py::_materialize_ephemeral_assets
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, _ASSET_REFERENCE_PATTERN, _CANONICAL_PAYLOAD_SCRIPT_PATTERN, normalize_transient_asset_payloads, re
from doe_export.html.reconcile.assets._normalize_browser_asset_overrides import _normalize_browser_asset_overrides

def _materialize_ephemeral_assets(
    canonical_html: str,
    asset_payloads: dict[str, Any],
    *,
    asset_overrides: dict[str, str] | None = None,
) -> str:
    """Expand managed references outside the hidden IR payload for Chromium."""

    validated = normalize_transient_asset_payloads(asset_payloads)
    overrides = _normalize_browser_asset_overrides(asset_overrides)
    payload_match = _CANONICAL_PAYLOAD_SCRIPT_PATTERN.search(canonical_html)
    if payload_match is None:
        raise ValueError("Current IR renderer produced no canonical payload.")

    def expand_visible(source: str) -> str:
        missing: set[str] = set()

        def replace(match: re.Match[str]) -> str:
            asset_id = match.group("asset_id").lower()
            delivery_asset_id = overrides.get(asset_id, asset_id)
            asset = validated.get(delivery_asset_id)
            if asset is None:
                missing.add(delivery_asset_id)
                return match.group(0)
            if match.group("kind").lower() == "base64":
                return asset["data_base64"]
            return f"data:{asset['content_type']};base64,{asset['data_base64']}"

        expanded = _ASSET_REFERENCE_PATTERN.sub(replace, source)
        if missing:
            preview = ", ".join(sorted(missing)[:3])
            suffix = "" if len(missing) <= 3 else f" (+{len(missing) - 3} more)"
            raise ValueError(
                "presentation_assets is missing referenced asset payloads: "
                f"{preview}{suffix}."
            )
        return expanded

    # The trusted Current IR must remain reference-only. Only the visible
    # document/CSS is expanded, and the whole shell is discarded after compile.
    return (
        expand_visible(canonical_html[: payload_match.start("content")])
        + canonical_html[payload_match.start("content") : payload_match.end("content")]
        + expand_visible(canonical_html[payload_match.end("content") :])
    )

_materialize_ephemeral_assets.__module__ = 'pptx2html.htmlir.reconcile'
