# Origin: pptx2html/server/ooxml_pptx_writer.py::relative_target
from __future__ import annotations
from doe_export.pptx.ooxml.shared import posixpath

def relative_target(source_dir: str, target_part: str) -> str:
    return posixpath.relpath(target_part, source_dir)

relative_target.__module__ = 'pptx2html.server.ooxml_pptx_writer'
