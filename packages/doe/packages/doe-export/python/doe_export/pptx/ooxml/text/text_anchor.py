# Origin: pptx2html/server/ooxml_pptx_writer.py::text_anchor
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def text_anchor(value: Any) -> str:
    return {
        "t": "t",
        "top": "t",
        "mid": "ctr",
        "middle": "ctr",
        "center": "ctr",
        "ctr": "ctr",
        "bot": "b",
        "bottom": "b",
        "b": "b",
    }.get(str(value or "top"), "t")

text_anchor.__module__ = 'pptx2html.server.ooxml_pptx_writer'
