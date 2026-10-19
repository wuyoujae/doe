# Origin: pptx2html/htmlir/compiler.py::_normalize_serialized_html_source
from __future__ import annotations
from doe_export.html.compiler.shared import _ESCAPED_HTML_ATTRIBUTE_PATTERN, _HTML_TAG_PATTERN, _MARKDOWN_HTML_FENCE_PATTERN, json
from doe_export.html.compiler.typography._decode_unwrapped_json_html_string import _decode_unwrapped_json_html_string

def _normalize_serialized_html_source(source: str) -> tuple[str, bool]:
    """Recover common transport wrappers and one extra JSON escaping layer."""

    recovered = False
    fence = _MARKDOWN_HTML_FENCE_PATTERN.fullmatch(source)
    if fence:
        source = fence.group("html")
        recovered = True

    stripped = source.strip()
    if stripped.startswith(('"', "{")):
        try:
            container = json.loads(stripped)
        except (TypeError, ValueError, json.JSONDecodeError):
            container = None
        if isinstance(container, str) and "<" in container:
            source = container
            recovered = True
        elif isinstance(container, dict):
            candidates = [
                container.get(key)
                for key in ("html", "slide_content", "slideContent", "content")
                if isinstance(container.get(key), str) and "<" in container[key]
            ]
            if len(candidates) == 1:
                source = candidates[0]
                recovered = True

    if not _ESCAPED_HTML_ATTRIBUTE_PATTERN.search(source):
        return source, recovered

    decoded = _decode_unwrapped_json_html_string(source)
    if decoded is not None:
        return decoded, True

    changed = False

    def restore_tag(match: re.Match[str]) -> str:
        nonlocal changed
        tag = match.group(0)
        restored = tag.replace('\\"', '"').replace("\\'", "'")
        changed = changed or restored != tag
        return restored

    restored_source = _HTML_TAG_PATTERN.sub(restore_tag, source)
    return restored_source, recovered or changed

_normalize_serialized_html_source.__module__ = 'pptx2html.htmlir.compiler'
