# Origin: pptx2html/htmlir/compiler.py::_text_frame_plain_text
from __future__ import annotations
from doe_export.html.compiler.shared import TextFrame

def _text_frame_plain_text(text_frame: TextFrame) -> str:
    return "\n".join(paragraph.text for paragraph in text_frame.paragraphs if paragraph.text).strip()

_text_frame_plain_text.__module__ = 'pptx2html.htmlir.compiler'
