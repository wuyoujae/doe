# Origin: pptx2html/ir/builder.py::PresentationBuilder._merge_border_style
from __future__ import annotations
from doe_export.ir.importer.shared import Border, Optional

@staticmethod
def _merge_border_style(border: Border, style: Optional[Border]) -> None:
    if style is None:
        return
    if border.no_fill:
        return
    if border.width is None:
        border.width = style.width
    if border.color is None:
        border.color = style.color
    if border.dash is None:
        border.dash = style.dash
    if border.cap is None:
        border.cap = style.cap
    if border.compound is None:
        border.compound = style.compound
    if border.alignment is None:
        border.alignment = style.alignment
    if border.join is None:
        border.join = style.join
    if border.head_end_type is None:
        border.head_end_type = style.head_end_type
        border.head_end_width = style.head_end_width
        border.head_end_length = style.head_end_length
    if border.tail_end_type is None:
        border.tail_end_type = style.tail_end_type
        border.tail_end_width = style.tail_end_width
        border.tail_end_length = style.tail_end_length

_merge_border_style.__func__.__module__ = 'pptx2html.ir.builder'
_merge_border_style.__func__.__qualname__ = 'PresentationBuilder._merge_border_style'
