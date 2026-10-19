# Origin: pptx2html/htmlir/compiler.py::_managed_image_asset_id
from __future__ import annotations
from doe_export.html.compiler.shared import base64, hashlib, re

def _managed_image_asset_id(source: str) -> str | None:
    raw = str(source or "").strip()
    match = re.fullmatch(
        r"yrkie-asset-(?:data|base64)://([0-9a-fA-F]{64})",
        raw,
    )
    if match is not None:
        return match.group(1).lower()
    match = re.fullmatch(
        r"data:[a-zA-Z0-9.+-]+/[a-zA-Z0-9.+-]+(?:;[^,]*)?;base64,"
        r"([A-Za-z0-9+/=\s]+)",
        raw,
        flags=re.IGNORECASE,
    )
    if match is None:
        return None
    try:
        payload = base64.b64decode(
            re.sub(r"\s+", "", match.group(1)),
            validate=True,
        )
    except Exception:
        return None
    return hashlib.sha256(payload).hexdigest()

_managed_image_asset_id.__module__ = 'pptx2html.htmlir.compiler'
