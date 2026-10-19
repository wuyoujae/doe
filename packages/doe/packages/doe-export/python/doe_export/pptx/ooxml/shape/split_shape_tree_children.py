# Origin: pptx2html/server/ooxml_pptx_writer.py::split_shape_tree_children
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET
from doe_export.pptx.ooxml.shape.is_shape_element import is_shape_element

def split_shape_tree_children(sp_tree: ET.Element) -> tuple[list[ET.Element], list[ET.Element]]:
    prefix: list[ET.Element] = []
    suffix: list[ET.Element] = []
    seen_shape = False
    for child in list(sp_tree):
        if is_shape_element(child):
            seen_shape = True
            continue
        if seen_shape:
            suffix.append(child)
        else:
            prefix.append(child)
    return prefix, suffix

split_shape_tree_children.__module__ = 'pptx2html.server.ooxml_pptx_writer'
