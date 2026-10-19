# Origin: pptx2html/server/ooxml_pptx_writer.py::register_namespace
from __future__ import annotations
from doe_export.pptx.ooxml.shared import ET, RESERVED_GENERATED_PREFIX_RE

def register_namespace(prefix: str, uri: str) -> None:
    if not prefix or not uri or prefix in {"xml", "xmlns"}:
        return
    if RESERVED_GENERATED_PREFIX_RE.fullmatch(prefix):
        return
    try:
        ET.register_namespace(prefix, uri)
    except ValueError:
        return

register_namespace.__module__ = 'pptx2html.server.ooxml_pptx_writer'
