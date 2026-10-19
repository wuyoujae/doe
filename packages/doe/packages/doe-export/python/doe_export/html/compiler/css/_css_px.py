# Origin: pptx2html/htmlir/compiler.py::_css_px
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import re

def _css_px(value: Any) -> float:
    raw = str(value or "").strip().lower()
    if not raw or raw in {"auto", "none", "normal"}:
        return 0.0
    match = re.search(r"[-+]?\d+(?:\.\d+)?", raw)
    if not match:
        return 0.0
    number = float(match.group(0))
    if raw.endswith("pt"):
        return number * (96.0 / 72.0)
    return number

_css_px.__module__ = 'pptx2html.htmlir.compiler'
