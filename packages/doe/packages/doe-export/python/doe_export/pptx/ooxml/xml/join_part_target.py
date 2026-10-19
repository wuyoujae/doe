# Origin: pptx2html/server/ooxml_pptx_writer.py::join_part_target
from __future__ import annotations
from doe_export.pptx.ooxml.shared import posixpath

def join_part_target(source_part: str, target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    return posixpath.normpath(posixpath.join(posixpath.dirname(source_part), target))

join_part_target.__module__ = 'pptx2html.server.ooxml_pptx_writer'
