# Origin: pptx2html/htmlir/compiler.py::recover_serialized_html_source
from __future__ import annotations
from doe_export.html.compiler.document._normalize_serialized_html_source import _normalize_serialized_html_source

def recover_serialized_html_source(source: str) -> str:
    """Return static HTML recovered from supported transport serialization wrappers."""

    return _normalize_serialized_html_source(source)[0]

recover_serialized_html_source.__module__ = 'pptx2html.htmlir.compiler'
