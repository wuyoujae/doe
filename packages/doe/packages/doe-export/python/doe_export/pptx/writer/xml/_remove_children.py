# Origin: pptx2html/server/pptx_writer.py::_remove_children
from __future__ import annotations
from doe_export.pptx.writer.shared import qn

def _remove_children(parent, names: tuple[str, ...]) -> None:
    tags = {qn(name) for name in names}
    for child in list(parent):
        if child.tag in tags:
            parent.remove(child)

_remove_children.__module__ = 'pptx2html.server.pptx_writer'
