# Origin: pptx2html/server/ooxml_pptx_writer.py::rels_part_name
from __future__ import annotations
from doe_export.pptx.ooxml.shared import posixpath

def rels_part_name(part_name: str) -> str:
    directory = posixpath.dirname(part_name)
    basename = posixpath.basename(part_name)
    return posixpath.join(directory, "_rels", f"{basename}.rels")

rels_part_name.__module__ = 'pptx2html.server.ooxml_pptx_writer'
