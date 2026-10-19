"""Content-based asset type helpers shared by import and rendering."""

from __future__ import annotations

import base64
import binascii
import hashlib
import re
from typing import Any


_FONT_CONTENT_TYPES = {
    b"\x00\x01\x00\x00": "font/ttf",
    b"OTTO": "font/otf",
    b"ttcf": "font/collection",
    b"wOFF": "font/woff",
    b"wOF2": "font/woff2",
}
_CONTENT_TYPE_PATTERN = re.compile(r"^[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+$")
_ASSET_REFERENCE_PREFIXES = (
    "yrkie-asset-data://",
    "yrkie-asset-base64://",
)
_DATA_URL_PATTERN = re.compile(
    r"^data:[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+(?:;[^,\s\"']*)?,",
    re.IGNORECASE,
)
_MAX_ASSET_BYTES = 32 * 1024 * 1024
_MAX_TOTAL_ASSET_BYTES = 48 * 1024 * 1024


def font_content_type_from_magic(blob: bytes) -> str | None:
    """Return the browser MIME type encoded by an SFNT/WOFF signature."""

    if not isinstance(blob, bytes) or len(blob) < 4:
        return None
    return _FONT_CONTENT_TYPES.get(blob[:4])


def css_font_format(content_type: str) -> str:
    """Map a normalized font MIME type to a CSS ``format()`` hint."""

    return {
        "font/ttf": "truetype",
        "font/otf": "opentype",
        "font/collection": "collection",
        "font/woff": "woff",
        "font/woff2": "woff2",
    }.get(str(content_type or "").strip().lower(), "opentype")


def normalize_transient_asset_payloads(
    asset_payloads: dict[str, Any] | None,
) -> dict[str, dict[str, Any]]:
    """Validate bounded content-addressed payloads used only during rendering."""

    if asset_payloads is None:
        return {}
    if not isinstance(asset_payloads, dict):
        raise ValueError("presentation_assets must be an object.")
    validated: dict[str, dict[str, Any]] = {}
    total_bytes = 0
    for raw_asset_id, payload in asset_payloads.items():
        asset_id = str(raw_asset_id or "").strip().lower()
        if re.fullmatch(r"[0-9a-f]{64}", asset_id) is None:
            raise ValueError("presentation_assets contains an invalid asset id.")
        if not isinstance(payload, dict):
            raise ValueError(f"presentation_assets[{asset_id}] must be an object.")
        content_type = str(payload.get("content_type") or "").strip().lower()
        encoded = payload.get("data_base64")
        if _CONTENT_TYPE_PATTERN.fullmatch(content_type) is None:
            raise ValueError(
                f"presentation_assets[{asset_id}].content_type is invalid."
            )
        if not isinstance(encoded, str) or not encoded:
            raise ValueError(
                f"presentation_assets[{asset_id}].data_base64 is required."
            )
        try:
            raw = base64.b64decode(re.sub(r"\s+", "", encoded), validate=True)
        except (ValueError, binascii.Error) as error:
            raise ValueError(
                f"presentation_assets[{asset_id}].data_base64 is invalid."
            ) from error
        if len(raw) > _MAX_ASSET_BYTES:
            raise ValueError(f"presentation_assets[{asset_id}] exceeds 32 MiB.")
        total_bytes += len(raw)
        if total_bytes > _MAX_TOTAL_ASSET_BYTES:
            raise ValueError("presentation_assets exceeds the 48 MiB total limit.")
        is_fallback = payload.get("is_fallback", False)
        if not isinstance(is_fallback, bool):
            raise ValueError(
                f"presentation_assets[{asset_id}].is_fallback must be a boolean."
            )
        if not is_fallback and hashlib.sha256(raw).hexdigest() != asset_id:
            raise ValueError(
                f"presentation_assets[{asset_id}] does not match its content hash."
            )
        validated[asset_id] = {
            "asset_id": asset_id,
            "content_type": content_type,
            "size_bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "data_base64": base64.b64encode(raw).decode("ascii"),
            "is_fallback": is_fallback,
        }
    return validated


def ir_contains_inline_asset(value: Any) -> bool:
    """Return whether typed IR resource fields still carry inline bytes.

    IR text and metadata are intentionally opaque strings. A visible Run may
    legitimately start with text such as ``data:image/png;base64,`` and must
    not be classified as a resource. Binary enforcement therefore applies
    only to the typed ``data``/``preview_data`` fields paired with their
    content-type slot, plus the ImageInfo ``url`` resource field.
    """

    if isinstance(value, dict):
        for field, content_type_field in (
            ("data", "content_type"),
            ("preview_data", "preview_content_type"),
        ):
            data = value.get(field)
            if (
                content_type_field in value
                and isinstance(data, str)
                and data
                and not data.startswith(_ASSET_REFERENCE_PREFIXES)
            ):
                return True
        url = value.get("url")
        if (
            isinstance(url, str)
            and _DATA_URL_PATTERN.match(url.strip()) is not None
        ):
            return True
        return any(ir_contains_inline_asset(item) for item in value.values())
    if isinstance(value, list):
        return any(ir_contains_inline_asset(item) for item in value)
    return False


__all__ = [
    "css_font_format",
    "font_content_type_from_magic",
    "ir_contains_inline_asset",
    "normalize_transient_asset_payloads",
]
