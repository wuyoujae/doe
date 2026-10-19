# Origin: pptx2html/server/pptx_writer.py::_preserve_run_text_space
from __future__ import annotations
from doe_export.pptx.writer.shared import qn
from doe_export.pptx.writer.text._text_needs_xml_space import _text_needs_xml_space

def _preserve_run_text_space(run, text: str) -> None:
    if not _text_needs_xml_space(text):
        return
    text_elem = run._r.find(qn("a:t"))
    if text_elem is not None:
        text_elem.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

_preserve_run_text_space.__module__ = 'pptx2html.server.pptx_writer'
