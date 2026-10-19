# Origin: pptx2html/server/ooxml_pptx_writer.py::insert_slide_child_before
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET

def insert_slide_child_before(root: ET.Element, elem: ET.Element, *, before_tags: set[str]) -> None:
    children = list(root)
    insert_at = len(children)
    for index, child in enumerate(children):
        if child.tag in before_tags:
            insert_at = index
            break
    root.insert(insert_at, elem)

insert_slide_child_before.__module__ = 'pptx2html.server.ooxml_pptx_writer'
