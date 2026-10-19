# Origin: pptx2html/htmlir/compiler.py::_css_unquote
from __future__ import annotations
from doe_export.html.compiler.shared import json

def _css_unquote(value: str) -> str:
    raw = str(value or "").strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in {"'", '"'}:
        body = raw[1:-1]
        if raw[0] == '"':
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                return body
        return body.replace("\\'", "'").replace("\\\\", "\\")
    return raw

_css_unquote.__module__ = 'pptx2html.htmlir.compiler'
