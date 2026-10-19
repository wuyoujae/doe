# Origin: pptx2html/htmlir/compiler.py::_is_canonical_slide_marker
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _is_canonical_slide_marker(value: object) -> bool:
    return bool(re.fullmatch(r"[1-9]\d*", str(value or "")))

_is_canonical_slide_marker.__module__ = 'pptx2html.htmlir.compiler'
