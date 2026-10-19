# Origin: pptx2html/htmlir/compiler.py::_table_cell_text_frame_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import TextFrame
from doe_export.html.compiler.shared import DEFAULT_VIEWPORT, SLIDE_HEIGHT, SLIDE_WIDTH
from doe_export.html.compiler.structure._table_vertical_align import _table_vertical_align
from doe_export.html.compiler.typography._text_frame_from_node import _text_frame_from_node

def _table_cell_text_frame_from_node(
    text: str,
    node: dict[str, Any],
    sx: float = SLIDE_WIDTH / DEFAULT_VIEWPORT[0],
    sy: float = SLIDE_HEIGHT / DEFAULT_VIEWPORT[1],
) -> TextFrame:
    text_frame = _text_frame_from_node(text, node, sx, sy)
    text_frame.vertical_align = _table_vertical_align(node)
    text_frame.margins = {"left": 0.0, "right": 0.0, "top": 0.0, "bottom": 0.0}
    text_frame.style_provenance = list(text_frame.style_provenance or []) + ["htmlir:table-cell-css"]
    return text_frame

_table_cell_text_frame_from_node.__module__ = 'pptx2html.htmlir.compiler'
