# Origin: pptx2html/server/pptx_writer.py::_vertical_anchor
from __future__ import annotations
from doe_export.pptx.writer.shared import MSO_ANCHOR

def _vertical_anchor(value: str | None):
    return {
        "mid": MSO_ANCHOR.MIDDLE,
        "bot": MSO_ANCHOR.BOTTOM,
    }.get(value or "top", MSO_ANCHOR.TOP)

_vertical_anchor.__module__ = 'pptx2html.server.pptx_writer'
