# Origin: pptx2html/htmlir/compiler.py::_decode_unwrapped_json_html_string
from __future__ import annotations
from doe_export.html.compiler.shared import json
from doe_export.html.compiler.document._has_unescaped_double_quote import _has_unescaped_double_quote

def _decode_unwrapped_json_html_string(source: str) -> str | None:
    if _has_unescaped_double_quote(source):
        return None
    encoded = (
        '"'
        + source.replace("\r", "\\r").replace("\n", "\\n").replace("\t", "\\t")
        + '"'
    )
    try:
        decoded = json.loads(encoded)
    except (TypeError, ValueError, json.JSONDecodeError):
        return None
    return decoded if isinstance(decoded, str) and "<" in decoded else None

_decode_unwrapped_json_html_string.__module__ = 'pptx2html.htmlir.compiler'
