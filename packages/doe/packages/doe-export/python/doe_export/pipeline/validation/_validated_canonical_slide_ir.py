# Origin: pptx_pipeline.py::_validated_canonical_slide_ir
from __future__ import annotations
from doe_export.pipeline.shared import Any
from doe_export.pipeline.shared import re
from doe_export.pipeline.shared import _CANONICAL_PAYLOAD_CONTENT_PATTERN, dataclasses, hashlib, json, presentation_from_dict

def _validated_canonical_slide_ir(
    source: str,
    matches: list[re.Match[str]],
    slide_position: int,
) -> dict[str, Any] | None:
    payload_match = _CANONICAL_PAYLOAD_CONTENT_PATTERN.search(source)
    if payload_match is None:
        return None
    try:
        payload = json.loads(payload_match.group("content").strip())
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    if (
        not isinstance(payload, dict)
        or payload.get("format") != "pptx2html-canonical-ir"
        or payload.get("version") != 1
    ):
        return None
    expected_hashes = payload.get("slide_hashes")
    presentation_value = payload.get("presentation")
    if (
        not isinstance(expected_hashes, list)
        or len(expected_hashes) != len(matches)
        or not isinstance(presentation_value, dict)
    ):
        return None
    expected_hash = expected_hashes[slide_position]
    if not isinstance(expected_hash, str):
        return None
    actual_hash = hashlib.sha256(
        matches[slide_position].group(0).encode("utf-8")
    ).hexdigest()
    if actual_hash != expected_hash:
        return None
    try:
        presentation = presentation_from_dict(presentation_value)
    except (TypeError, ValueError):
        return None
    if len(presentation.slides) != len(matches):
        return None
    one_slide = dataclasses.replace(
        presentation,
        slides=[presentation.slides[slide_position]],
    )
    return dataclasses.asdict(one_slide)

_validated_canonical_slide_ir.__module__ = 'pptx_pipeline'
