# Origin: pptx2html/server/pptx_writer.py::_clear_fill_children
from __future__ import annotations
from doe_export.pptx.writer.xml._remove_children import _remove_children

def _clear_fill_children(sp_pr) -> None:
    _remove_children(sp_pr, ("a:noFill", "a:solidFill", "a:gradFill", "a:blipFill", "a:pattFill", "a:grpFill"))

_clear_fill_children.__module__ = 'pptx2html.server.pptx_writer'
