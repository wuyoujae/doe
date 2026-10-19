# Origin: pptx2html/server/ooxml_pptx_writer.py::source_part_name_from_rels
from __future__ import annotations
from doe_export.pptx.ooxml.shared import posixpath

def source_part_name_from_rels(rels_name: str) -> str | None:
    directory = posixpath.dirname(rels_name)
    if posixpath.basename(directory) != "_rels" or not rels_name.endswith(".rels"):
        return None
    source_name = posixpath.basename(rels_name)[: -len(".rels")]
    return posixpath.join(posixpath.dirname(directory), source_name)

source_part_name_from_rels.__module__ = 'pptx2html.server.ooxml_pptx_writer'
