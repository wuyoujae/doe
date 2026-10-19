# Origin: htmlir_server.py::_optional_base64_bytes
from __future__ import annotations
from doe_export.service.shared import Any, MAX_SOURCE_PPTX_BYTES, base64, binascii

def _optional_base64_bytes(value: Any) -> bytes | None:
    if not isinstance(value, str) or not value:
        return None
    max_encoded_bytes = ((MAX_SOURCE_PPTX_BYTES + 2) // 3) * 4
    if len(value) > max_encoded_bytes:
        raise ValueError("source_pptx_base64 cannot exceed 100 MiB after decoding.")
    try:
        payload = base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error) as error:
        raise ValueError("source_pptx_base64 is invalid.") from error
    if len(payload) > MAX_SOURCE_PPTX_BYTES:
        raise ValueError("source_pptx_base64 cannot exceed 100 MiB after decoding.")
    return payload

_optional_base64_bytes.__module__ = 'htmlir_server'
