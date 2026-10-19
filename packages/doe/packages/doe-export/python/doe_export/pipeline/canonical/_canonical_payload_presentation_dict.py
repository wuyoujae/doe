# Origin: pptx_pipeline.py::_canonical_payload_presentation_dict
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import _CANONICAL_PAYLOAD_CONTENT_PATTERN, json

def _canonical_payload_presentation_dict(source: str) -> dict[str, Any] | None:
    match = _CANONICAL_PAYLOAD_CONTENT_PATTERN.search(source)
    if match is None:
        return None
    try:
        payload = json.loads(match.group("content").strip())
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    presentation = payload.get("presentation") if isinstance(payload, dict) else None
    return presentation if isinstance(presentation, dict) else None

_canonical_payload_presentation_dict.__module__ = 'pptx_pipeline'
