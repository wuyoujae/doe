# Origin: pptx2html/server/pptx_writer.py::_clean_hex
from __future__ import annotations

def _clean_hex(value: str | None) -> str | None:
    if not value:
        return None
    clean = str(value).strip().lstrip("#")
    if len(clean) != 6:
        return None
    try:
        int(clean, 16)
    except ValueError:
        return None
    return clean.upper()

_clean_hex.__module__ = 'pptx2html.server.pptx_writer'
