# Origin: pptx2html/htmlir/compiler.py::_is_canonical_html
from __future__ import annotations
from doe_export.html.compiler.shared import re

def _is_canonical_html(source: str) -> bool:
    return bool(
        re.search(
            r"data-pptx2html-canonical\s*=\s*(['\"])1\1",
            source,
            re.IGNORECASE,
        )
        and "data-pptx2html-slide" in source.lower()
    )

_is_canonical_html.__module__ = 'pptx2html.htmlir.compiler'
