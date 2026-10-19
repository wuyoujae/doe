# Origin: pptx2html/htmlir/compiler.py::_css_url
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re
from doe_export.html.compiler.css._css_unquote import _css_unquote

def _css_url(value: Any) -> str | None:
    match = re.search(r"url\(\s*(.*?)\s*\)", str(value or ""), re.IGNORECASE | re.DOTALL)
    if not match:
        return None
    return _css_unquote(match.group(1).strip())

_css_url.__module__ = 'pptx2html.htmlir.compiler'
