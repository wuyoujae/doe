# Origin: pptx2html/htmlir/compiler.py::_html_span
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re

def _html_span(
    node: dict[str, Any],
    attr: str,
    *,
    default: int,
    maximum: int,
    allow_zero: bool = False,
) -> int:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    raw = attrs.get(attr) if isinstance(attrs, dict) else None
    match = re.search(r"[-+]?\d+", str(raw or ""))
    if not match:
        return default
    value = int(match.group(0))
    if allow_zero and value == 0:
        return 0
    return max(1, min(maximum, value))

_html_span.__module__ = 'pptx2html.htmlir.compiler'
