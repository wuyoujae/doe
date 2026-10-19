# Origin: pptx_pipeline.py::_externalize_canonical_assets
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _CANONICAL_PAYLOAD_CONTENT_PATTERN, _DATA_URL_PATTERN, _PERCENT_SVG_DATA_URL_PATTERN, base64, binascii, hashlib, json, re, unquote_to_bytes
from doe_export.pipeline.assets._normalized_asset_content_type import _normalized_asset_content_type
from doe_export.pipeline.canonical._refresh_canonical_slide_hashes import _refresh_canonical_slide_hashes
from doe_export.pipeline.assets._sanitize_composed_svg_asset import _sanitize_composed_svg_asset
from doe_export.pipeline.assets._transparent_svg_placeholder import _transparent_svg_placeholder

def _externalize_canonical_assets(
    html: str,
    assets: dict[str, dict[str, Any]],
    *,
    known_asset_ids: set[str] | None = None,
    resolver_assets: dict[str, dict[str, Any]] | None = None,
    diagnostics: list[dict[str, str]] | None = None,
) -> str:
    raw_replacements: dict[str, str] = {}
    known_assets = known_asset_ids or set()
    available_assets = dict(resolver_assets or {})
    available_assets.update(assets)
    resource_diagnostics = diagnostics if diagnostics is not None else []

    def register_raw_asset(content_type: str, raw: bytes) -> str:
        content_type = _normalized_asset_content_type(content_type, raw)
        digest = hashlib.sha256(raw).hexdigest()
        entry = {
            "asset_id": digest,
            "content_type": content_type.lower(),
            "size_bytes": len(raw),
            "sha256": digest,
            "data_base64": base64.b64encode(raw).decode("ascii"),
        }
        available_assets[digest] = entry
        if digest not in known_assets:
            assets.setdefault(digest, entry)
        reference = f"yrkie-asset-base64://{digest}"
        return reference

    def register_asset(content_type: str, encoded: str) -> str | None:
        encoded = re.sub(r"\s+", "", encoded)
        try:
            raw = base64.b64decode(encoded, validate=True)
        except (ValueError, binascii.Error):
            return None
        reference = register_raw_asset(content_type, raw)
        raw_replacements[encoded] = reference
        return reference

    # The browser may render a compressed preview while the canonical IR keeps
    # the original picture bytes for lossless PPTX export. Externalize both
    # fields independently; otherwise the original can remain as a very large
    # inline Base64 string when only the preview appears in the visible DOM.
    payload_match = _CANONICAL_PAYLOAD_CONTENT_PATTERN.search(html)
    if payload_match is not None:
        try:
            payload = json.loads(payload_match.group("content").strip())
        except (TypeError, ValueError, json.JSONDecodeError):
            payload = None

        def externalize_payload_assets(value: Any) -> None:
            if isinstance(value, dict):
                for field, content_type_field in (
                    ("data", "content_type"),
                    ("preview_data", "preview_content_type"),
                ):
                    encoded = value.get(field)
                    content_type = value.get(content_type_field)
                    if (
                        isinstance(encoded, str)
                        and encoded
                        and not encoded.startswith(("yrkie-asset-", "data:"))
                        and isinstance(content_type, str)
                        and "/" in content_type
                    ):
                        reference = register_asset(content_type, encoded)
                        if reference is not None:
                            value[field] = reference
                for child in value.values():
                    externalize_payload_assets(child)
            elif isinstance(value, list):
                for child in value:
                    externalize_payload_assets(child)

        if isinstance(payload, dict):
            externalize_payload_assets(payload)
            raw = json.dumps(
                payload,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            safe = raw.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
            html = (
                html[: payload_match.start("content")]
                + safe
                + html[payload_match.end("content") :]
            )

    def replace_percent_svg_data_url(match: re.Match[str]) -> str:
        try:
            raw = unquote_to_bytes(match.group("data"))
        except (TypeError, ValueError):
            raw = _transparent_svg_placeholder()
            resource_diagnostics.append(
                {
                    "severity": "warning",
                    "code": "svg-resource-replaced",
                    "message": "An invalid composed SVG was replaced by a placeholder.",
                }
            )
        passive_svg = _sanitize_composed_svg_asset(
            raw,
            available_assets,
            resource_diagnostics,
        )
        reference = register_raw_asset("image/svg+xml", passive_svg)
        return reference.replace(
            "yrkie-asset-base64://",
            "yrkie-asset-data://",
            1,
        )

    def replace_data_url(match: re.Match[str]) -> str:
        content_type = match.group("content_type").lower()
        encoded = re.sub(r"\s+", "", match.group("data"))
        reference = register_asset(content_type, encoded)
        if reference is None:
            return match.group(0)
        return reference.replace("yrkie-asset-base64://", "yrkie-asset-data://", 1)

    def replace_resource_urls(source: str) -> str:
        source = _PERCENT_SVG_DATA_URL_PATTERN.sub(
            replace_percent_svg_data_url,
            source,
        )
        return _DATA_URL_PATTERN.sub(replace_data_url, source)

    # Canonical resources live in tag attributes or stylesheet text. Visible
    # text is opaque user content and may itself document a data URL; replacing
    # it would corrupt the Slide and manufacture a phantom asset.
    pieces = re.split(r"(<[^>]*>)", html)
    in_style = False
    in_script = False
    for index, piece in enumerate(pieces):
        if not piece:
            continue
        if piece.startswith("<"):
            lowered = piece.lstrip().lower()
            if not in_script:
                pieces[index] = replace_resource_urls(piece)
            if re.match(r"<\s*style\b", lowered):
                in_style = True
            elif re.match(r"<\s*/\s*style\b", lowered):
                in_style = False
            elif re.match(r"<\s*script\b", lowered):
                in_script = True
            elif re.match(r"<\s*/\s*script\b", lowered):
                in_script = False
        elif in_style and not in_script:
            pieces[index] = replace_resource_urls(piece)
    externalized = "".join(pieces)
    for encoded, reference in raw_replacements.items():
        externalized = externalized.replace(f'"data":"{encoded}"', f'"data":"{reference}"')
        externalized = externalized.replace(
            f'"preview_data":"{encoded}"',
            f'"preview_data":"{reference}"',
        )
    return _refresh_canonical_slide_hashes(externalized)

_externalize_canonical_assets.__module__ = 'pptx_pipeline'
