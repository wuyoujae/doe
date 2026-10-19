# Origin: pptx_pipeline.py::_externalize_ir_assets
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _DATA_URL_PATTERN, base64, binascii, copy, hashlib, re
from doe_export.pipeline.assets._assert_no_inline_binary_ir import _assert_no_inline_binary_ir
from doe_export.pipeline.assets._normalized_asset_content_type import _normalized_asset_content_type
from doe_export.pipeline.assets._sanitize_composed_svg_asset import _sanitize_composed_svg_asset

def _externalize_ir_assets(
    presentation_ir: dict[str, Any],
    assets: dict[str, dict[str, Any]],
    *,
    known_asset_ids: set[str] | None = None,
    diagnostics: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Copy an IR tree while replacing typed binary fields with asset refs."""

    externalized = copy.deepcopy(presentation_ir)
    known_assets = known_asset_ids or set()
    resource_diagnostics = diagnostics if diagnostics is not None else []

    def register_raw(content_type: str, raw: bytes, *, data_reference: bool) -> str:
        normalized_type = _normalized_asset_content_type(content_type, raw)
        if normalized_type == "image/svg+xml":
            raw = _sanitize_composed_svg_asset(raw, assets, resource_diagnostics)
        digest = hashlib.sha256(raw).hexdigest()
        if digest not in known_assets:
            assets.setdefault(
                digest,
                {
                    "asset_id": digest,
                    "content_type": normalized_type,
                    "size_bytes": len(raw),
                    "sha256": digest,
                    "data_base64": base64.b64encode(raw).decode("ascii"),
                },
            )
        scheme = "data" if data_reference else "base64"
        return f"yrkie-asset-{scheme}://{digest}"

    def visit(value: Any) -> None:
        if isinstance(value, dict):
            for field, content_type_field in (
                ("data", "content_type"),
                ("preview_data", "preview_content_type"),
            ):
                encoded_value = value.get(field)
                content_type = value.get(content_type_field)
                if (
                    not isinstance(encoded_value, str)
                    or not encoded_value
                    or not isinstance(content_type, str)
                    or "/" not in content_type
                ):
                    continue
                if encoded_value.startswith("yrkie-asset-base64://"):
                    continue
                encoded = encoded_value
                data_url_match = _DATA_URL_PATTERN.fullmatch(encoded_value.strip())
                if data_url_match is not None:
                    encoded = data_url_match.group("data")
                    content_type = data_url_match.group("content_type")
                try:
                    raw = base64.b64decode(
                        re.sub(r"\s+", "", encoded),
                        validate=True,
                    )
                except (ValueError, binascii.Error) as error:
                    raise ValueError(
                        f"PresentationIR field '{field}' contains invalid inline asset data."
                    ) from error
                normalized_type = _normalized_asset_content_type(content_type, raw)
                value[field] = register_raw(
                    normalized_type,
                    raw,
                    data_reference=False,
                )
                value[content_type_field] = normalized_type
            url = value.get("url")
            if isinstance(url, str) and url:
                data_url_match = _DATA_URL_PATTERN.fullmatch(url.strip())
                if data_url_match is not None:
                    try:
                        raw = base64.b64decode(
                            re.sub(r"\s+", "", data_url_match.group("data")),
                            validate=True,
                        )
                    except (ValueError, binascii.Error) as error:
                        raise ValueError(
                            "PresentationIR field 'url' contains invalid inline asset data."
                        ) from error
                    value["url"] = register_raw(
                        data_url_match.group("content_type"),
                        raw,
                        data_reference=True,
                    )
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(externalized)
    _assert_no_inline_binary_ir(externalized)
    return externalized

_externalize_ir_assets.__module__ = 'pptx_pipeline'
