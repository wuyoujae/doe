# Origin: pptx2html/server/ooxml_pptx_writer.py::replace_direct_child
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET

def replace_direct_child(parent: ET.Element, tag: str, replacement: ET.Element, *, before_tag: str | None = None) -> None:
    children = list(parent)
    attrs = dict(parent.attrib)
    parent.clear()
    parent.attrib.update(attrs)
    inserted = False
    for child in children:
        if child.tag == tag:
            if not inserted:
                parent.append(replacement)
                inserted = True
            continue
        if not inserted and before_tag is not None and child.tag == before_tag:
            parent.append(replacement)
            inserted = True
        parent.append(child)
    if not inserted:
        parent.insert(0, replacement)

replace_direct_child.__module__ = 'pptx2html.server.ooxml_pptx_writer'
