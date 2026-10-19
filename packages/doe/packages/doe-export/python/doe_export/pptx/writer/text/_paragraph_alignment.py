# Origin: pptx2html/server/pptx_writer.py::_paragraph_alignment
from __future__ import annotations
from doe_export.pptx.writer.shared import PP_ALIGN

def _paragraph_alignment(value: str | None):
    return {
        "ctr": PP_ALIGN.CENTER,
        "r": PP_ALIGN.RIGHT,
        "just": PP_ALIGN.JUSTIFY,
    }.get(value or "l", PP_ALIGN.LEFT)

_paragraph_alignment.__module__ = 'pptx2html.server.pptx_writer'
