# Origin: pptx2html/htmlir/compiler.py::_unchanged_canonical_presentation
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import hashlib, json, presentation_from_dict, re

def _unchanged_canonical_presentation(source: str) -> tuple[Presentation, int] | None:
    payload_match = re.search(
        r"<script\b[^>]*\bdata-pptx2html-ir\s*=\s*(['\"])1\1[^>]*>(.*?)</script\s*>",
        source,
        re.IGNORECASE | re.DOTALL,
    )
    if payload_match is None:
        return None
    try:
        payload = json.loads(payload_match.group(2).strip())
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
    if not isinstance(expected_hashes, list) or not isinstance(presentation_value, dict):
        return None
    fragment_pattern = re.compile(
        r"(<!--\s*PPTX2HTML_SLIDE_START:(?P<index>\d+)\s*-->.*?"
        r"<!--\s*PPTX2HTML_SLIDE_END:(?P=index)\s*-->)",
        re.IGNORECASE | re.DOTALL,
    )
    fragments = fragment_pattern.findall(source)
    if len(fragments) != len(expected_hashes):
        return None
    actual_hashes = [hashlib.sha256(fragment[0].encode("utf-8")).hexdigest() for fragment in fragments]
    if actual_hashes != expected_hashes:
        return None
    try:
        presentation = presentation_from_dict(presentation_value)
    except (TypeError, ValueError):
        return None
    if len(presentation.slides) != len(expected_hashes):
        return None
    return presentation, len(expected_hashes)

_unchanged_canonical_presentation.__module__ = 'pptx2html.htmlir.compiler'
