# Origin: pptx2html/server/ooxml_pptx_writer.py::clean_hex
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def clean_hex(value: Any) -> str:
    text = str(value or "000000").strip().lstrip("#").upper()
    if len(text) == 8:
        text = text[-6:]
    if len(text) != 6 or any(char not in "0123456789ABCDEF" for char in text):
        return "000000"
    return text

clean_hex.__module__ = 'pptx2html.server.ooxml_pptx_writer'
