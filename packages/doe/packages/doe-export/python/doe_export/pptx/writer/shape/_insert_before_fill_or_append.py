# Origin: pptx2html/server/pptx_writer.py::_insert_before_fill_or_append
from __future__ import annotations
from doe_export.pptx.writer.shared import qn

def _insert_before_fill_or_append(parent, child) -> None:
    fill_tags = {
        qn("a:noFill"),
        qn("a:solidFill"),
        qn("a:gradFill"),
        qn("a:blipFill"),
        qn("a:pattFill"),
        qn("a:grpFill"),
    }
    for index, existing in enumerate(list(parent)):
        if existing.tag in fill_tags:
            parent.insert(index, child)
            return
    parent.append(child)

_insert_before_fill_or_append.__module__ = 'pptx2html.server.pptx_writer'
