# Origin: pptx2html/htmlir/compiler.py::_canonical_payload_presentation
from __future__ import annotations
from doe_export.html.compiler.shared import Presentation
from doe_export.html.compiler.shared import json, presentation_from_dict, re

def _canonical_payload_presentation(source: str) -> Presentation | None:
    payload_match = re.search(
        r"<script\b[^>]*\bdata-pptx2html-ir\s*=\s*(['\"])1\1[^>]*>(.*?)</script\s*>",
        source,
        re.IGNORECASE | re.DOTALL,
    )
    if payload_match is None:
        return None
    try:
        payload = json.loads(payload_match.group(2).strip())
        if (
            not isinstance(payload, dict)
            or payload.get("format") != "pptx2html-canonical-ir"
            or payload.get("version") != 1
        ):
            return None
        value = payload.get("presentation")
        return presentation_from_dict(value) if isinstance(value, dict) else None
    except (TypeError, ValueError, json.JSONDecodeError):
        return None

_canonical_payload_presentation.__module__ = 'pptx2html.htmlir.compiler'
