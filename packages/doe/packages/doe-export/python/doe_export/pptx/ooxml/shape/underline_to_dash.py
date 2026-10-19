# Origin: pptx2html/server/ooxml_pptx_writer.py::underline_to_dash
from __future__ import annotations

def underline_to_dash(value: str) -> str | None:
    normalized = value.strip().lower()
    if normalized.startswith("dot"):
        return "dot"
    if normalized.startswith("dash"):
        return "dash"
    return None

underline_to_dash.__module__ = 'pptx2html.server.ooxml_pptx_writer'
