# Origin: pptx2html/server/pptx_writer.py::_text_anchor
from __future__ import annotations
from doe_export.pptx.writer.table._table_vertical_anchor import _table_vertical_anchor

def _text_anchor(value: str | None) -> str:
    return _table_vertical_anchor(value)

_text_anchor.__module__ = 'pptx2html.server.pptx_writer'
