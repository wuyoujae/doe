# Origin: pptx2html/server/pptx_writer.py::_remove_presentation_shape_style
from __future__ import annotations
from doe_export.pptx.writer.shared import qn

def _remove_presentation_shape_style(pptx_shape) -> None:
    element = pptx_shape._element
    style = element.find(qn("p:style"))
    if style is not None:
        element.remove(style)

_remove_presentation_shape_style.__module__ = 'pptx2html.server.pptx_writer'
