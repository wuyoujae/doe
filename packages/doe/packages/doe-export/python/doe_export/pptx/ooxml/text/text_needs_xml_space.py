# Origin: pptx2html/server/ooxml_pptx_writer.py::text_needs_xml_space
from __future__ import annotations

def text_needs_xml_space(text: str) -> bool:
    return bool(
        text
        and (
            text[0].isspace()
            or text[-1].isspace()
            or "  " in text
            or "\t" in text
        )
    )

text_needs_xml_space.__module__ = 'pptx2html.server.ooxml_pptx_writer'
