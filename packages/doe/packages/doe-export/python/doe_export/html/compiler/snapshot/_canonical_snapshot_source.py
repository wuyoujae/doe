# Origin: pptx2html/htmlir/compiler.py::_canonical_snapshot_source
from __future__ import annotations
from doe_export.html.compiler.shared import _CANONICAL_SCRIPT_ID_PATTERN, _CANONICAL_SCRIPT_MARKER_PATTERN, _CANONICAL_SCRIPT_TYPE_PATTERN, _SCRIPT_ELEMENT_PATTERN

def _canonical_snapshot_source(source: str) -> str:
    """Remove only a double-escaped canonical payload before Chromium.

    AI-edited canonical HTML can preserve the visible slide DOM while emitting
    the inert JSON payload attributes as ``id=\"...\"``. Those backslashes make
    the attributes invalid HTML, so the browser safety gate correctly treats
    the element as an active script. Drop only that narrowly identified,
    untrusted payload and let the existing canonical DOM fallback rebuild IR.
    """

    def remove_escaped_payload(match: re.Match[str]) -> str:
        attributes = match.group("attributes")
        normalized = attributes.replace('\\"', '"').replace("\\'", "'")
        if normalized == attributes:
            return match.group(0)
        if (
            _CANONICAL_SCRIPT_ID_PATTERN.search(normalized)
            and _CANONICAL_SCRIPT_TYPE_PATTERN.search(normalized)
            and _CANONICAL_SCRIPT_MARKER_PATTERN.search(normalized)
        ):
            return ""
        return match.group(0)

    return _SCRIPT_ELEMENT_PATTERN.sub(remove_escaped_payload, source)

_canonical_snapshot_source.__module__ = 'pptx2html.htmlir.compiler'
