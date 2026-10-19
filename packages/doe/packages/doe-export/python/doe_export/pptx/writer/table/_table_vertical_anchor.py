# Origin: pptx2html/server/pptx_writer.py::_table_vertical_anchor
from __future__ import annotations

def _table_vertical_anchor(value: str | None) -> str:
    return {
        "mid": "ctr",
        "ctr": "ctr",
        "middle": "ctr",
        "bot": "b",
        "bottom": "b",
        "b": "b",
    }.get(value or "top", "t")

_table_vertical_anchor.__module__ = 'pptx2html.server.pptx_writer'
