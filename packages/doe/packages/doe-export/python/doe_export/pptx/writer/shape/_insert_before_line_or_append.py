# Origin: pptx2html/server/pptx_writer.py::_insert_before_line_or_append
from __future__ import annotations
from doe_export.pptx.writer.shared import qn

def _insert_before_line_or_append(parent, child) -> None:
    tail_tags = {
        qn("a:ln"),
        qn("a:effectLst"),
        qn("a:effectDag"),
        qn("a:scene3d"),
        qn("a:sp3d"),
        qn("a:extLst"),
    }
    for index, existing in enumerate(list(parent)):
        if existing.tag in tail_tags:
            parent.insert(index, child)
            return
    parent.append(child)

_insert_before_line_or_append.__module__ = 'pptx2html.server.pptx_writer'
