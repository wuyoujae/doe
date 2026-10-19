# Origin: pptx2html/server/pptx_writer.py::_insert_slide_child_before
from __future__ import annotations

def _insert_slide_child_before(root, child, before_tags: tuple[str, ...]) -> None:
    for index, existing in enumerate(list(root)):
        if existing.tag in before_tags:
            root.insert(index, child)
            return
    root.append(child)

_insert_slide_child_before.__module__ = 'pptx2html.server.pptx_writer'
