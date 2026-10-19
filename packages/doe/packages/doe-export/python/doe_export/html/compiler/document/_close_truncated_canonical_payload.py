# Origin: pptx2html/htmlir/compiler.py::_close_truncated_canonical_payload
from __future__ import annotations
from doe_export.html.compiler.shared import _CANONICAL_SCRIPT_ID_PATTERN, _CANONICAL_SCRIPT_MARKER_PATTERN, _CANONICAL_SCRIPT_TYPE_PATTERN, _SCRIPT_OPEN_PATTERN, json, re

def _close_truncated_canonical_payload(source: str) -> tuple[str, bool]:
    """Close a transport-truncated inert canonical JSON payload.

    This deliberately does not repair arbitrary ``script`` elements.  The
    unclosed element must be the final element in a canonical document, carry
    the exact inert-payload attributes, have no ``src``, and contain valid v1
    canonical IR JSON through the end of the source.
    """

    if not re.search(
        r"data-pptx2html-canonical\s*=\s*(['\"])1\1",
        source,
        re.IGNORECASE,
    ):
        return source, False

    openings = list(_SCRIPT_OPEN_PATTERN.finditer(source))
    if not openings:
        return source, False
    opening = openings[-1]
    tail = source[opening.end() :]
    if re.search(r"</script\s*>", tail, re.IGNORECASE):
        return source, False

    attributes = opening.group("attributes")
    if (
        not _CANONICAL_SCRIPT_ID_PATTERN.search(attributes)
        or not _CANONICAL_SCRIPT_TYPE_PATTERN.search(attributes)
        or not _CANONICAL_SCRIPT_MARKER_PATTERN.search(attributes)
        or re.search(r"\bsrc\s*=", attributes, re.IGNORECASE)
    ):
        return source, False

    try:
        payload = json.loads(tail.strip())
    except (TypeError, ValueError, json.JSONDecodeError):
        return source, False
    if (
        not isinstance(payload, dict)
        or payload.get("format") != "pptx2html-canonical-ir"
        or payload.get("version") != 1
        or not isinstance(payload.get("presentation"), dict)
    ):
        return source, False
    return f"{source}</script>", True

_close_truncated_canonical_payload.__module__ = 'pptx2html.htmlir.compiler'
