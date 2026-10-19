# Origin: pptx_pipeline.py::_refresh_canonical_slide_hashes
from __future__ import annotations
from doe_export.pipeline.shared import _CANONICAL_PAYLOAD_CONTENT_PATTERN, _CANONICAL_SLIDE_FRAGMENT_PATTERN, hashlib, json

def _refresh_canonical_slide_hashes(html: str) -> str:
    """Bind the lossless IR payload to the final persisted slide fragments."""

    payload_match = _CANONICAL_PAYLOAD_CONTENT_PATTERN.search(html)
    if payload_match is None:
        return html
    try:
        payload = json.loads(payload_match.group("content").strip())
    except (TypeError, ValueError, json.JSONDecodeError):
        return html
    if (
        not isinstance(payload, dict)
        or payload.get("format") != "pptx2html-canonical-ir"
        or payload.get("version") != 1
        or not isinstance(payload.get("slide_hashes"), list)
    ):
        return html

    fragments = [match.group(0) for match in _CANONICAL_SLIDE_FRAGMENT_PATTERN.finditer(html)]
    if len(fragments) != len(payload["slide_hashes"]):
        return html
    payload["slide_hashes"] = [
        hashlib.sha256(fragment.encode("utf-8")).hexdigest()
        for fragment in fragments
    ]
    raw = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    safe = raw.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
    return (
        html[: payload_match.start("content")]
        + safe
        + html[payload_match.end("content") :]
    )

_refresh_canonical_slide_hashes.__module__ = 'pptx_pipeline'
