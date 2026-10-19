# Origin: pptx2html/htmlir/reconcile.py::_composed_svg_uses_source_asset
from __future__ import annotations
from doe_export.html.reconcile.shared import Any, ET, base64, binascii, hashlib, re

def _composed_svg_uses_source_asset(
    image: dict[str, Any],
    source_asset_id: str,
    assets: dict[str, dict[str, Any]],
) -> bool:
    source = str(image.get("url") or "")
    raw_svg: bytes | None = None
    data_match = re.fullmatch(
        r"data:image/svg\+xml;base64,(?P<data>[A-Za-z0-9+/=\s]+)",
        source,
        re.IGNORECASE,
    )
    if data_match is not None:
        try:
            raw_svg = base64.b64decode(
                re.sub(r"\s+", "", data_match.group("data")),
                validate=True,
            )
        except (ValueError, binascii.Error):
            return False
    else:
        ref_match = re.fullmatch(
            r"yrkie-asset-data://(?P<asset_id>[0-9a-fA-F]{64})",
            source,
        )
        if ref_match is not None:
            outer = assets.get(ref_match.group("asset_id").lower())
            if (
                outer is not None
                and str(outer.get("content_type") or "").lower() == "image/svg+xml"
            ):
                try:
                    raw_svg = base64.b64decode(
                        str(outer.get("data_base64") or ""),
                        validate=True,
                    )
                except (ValueError, binascii.Error):
                    return False
    if raw_svg is None:
        return False
    try:
        root = ET.fromstring(raw_svg.decode("utf-8"))
    except (UnicodeDecodeError, ET.ParseError):
        return False

    expected = assets.get(source_asset_id)
    expected_raw: bytes | None = None
    if expected is not None:
        try:
            expected_raw = base64.b64decode(
                str(expected.get("data_base64") or ""),
                validate=True,
            )
        except (ValueError, binascii.Error):
            expected_raw = None
    for element in root.iter():
        for name, value in element.attrib.items():
            if name.rsplit("}", 1)[-1].lower() not in {"href", "src"}:
                continue
            nested = re.fullmatch(
                r"data:image/[a-zA-Z0-9.+-]+;base64,"
                r"(?P<data>[A-Za-z0-9+/=\s]+)",
                str(value).strip(),
                re.IGNORECASE,
            )
            if nested is None:
                continue
            try:
                raw = base64.b64decode(
                    re.sub(r"\s+", "", nested.group("data")),
                    validate=True,
                )
            except (ValueError, binascii.Error):
                continue
            if expected_raw is not None:
                if raw == expected_raw:
                    return True
            elif hashlib.sha256(raw).hexdigest() == source_asset_id:
                return True
    return False

_composed_svg_uses_source_asset.__module__ = 'pptx2html.htmlir.reconcile'
