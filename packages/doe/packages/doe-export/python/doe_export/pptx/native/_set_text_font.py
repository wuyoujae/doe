# Origin: schema_v4_native.py::_set_text_font
from __future__ import annotations
from .shared import DEFAULT_HEADING_COLOR, PP_ALIGN, Pt
from ._rgb import _rgb

def _set_text_font(
    text_frame,
    *,
    family: str,
    size: float,
    bold: bool = False,
) -> None:
    for paragraph in text_frame.paragraphs:
        paragraph.alignment = PP_ALIGN.CENTER
        for run in paragraph.runs:
            run.font.name = family
            run.font.size = Pt(size)
            run.font.bold = bold
            run.font.color.rgb = _rgb(DEFAULT_HEADING_COLOR)

_set_text_font.__module__ = 'schema_v4_native'
