# Origin: pptx2html/htmlir/compiler.py::_marker_text_from_content
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_float import _css_float
from doe_export.html.compiler.css._css_unquote import _css_unquote

def _marker_text_from_content(content: str, list_info: dict[str, Any]) -> str | None:
    raw = str(content or "").strip()
    if not raw or raw.lower() in {"normal", "none", "auto"}:
        return None
    ordinal = int(
        _css_float(
            list_info.get("counterOrdinal"),
            _css_float(list_info.get("ordinal"), 1),
        )
    )
    token_re = re.compile(r'"(?:\\.|[^"])*"|\'(?:\\.|[^\'])*\'|counters?\([^)]*\)', re.IGNORECASE)
    pieces: list[str] = []
    for match in token_re.finditer(raw):
        token = match.group(0)
        lower = token.lower()
        if lower.startswith("counter(") or lower.startswith("counters("):
            pieces.append(str(max(0, ordinal)))
        else:
            pieces.append(_css_unquote(token))
    if not pieces and (raw[0:1] in {"'", '"'}):
        pieces.append(_css_unquote(raw))
    text = "".join(pieces).strip()
    return text or None

_marker_text_from_content.__module__ = 'pptx2html.htmlir.compiler'
