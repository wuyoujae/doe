# Origin: pptx2html/server/pptx_writer.py::_add_auto_shape
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.geometry._apply_custom_geometry import _apply_custom_geometry
from doe_export.pptx.writer.shape._apply_fill import _apply_fill
from doe_export.pptx.writer.shape._apply_line import _apply_line
from doe_export.pptx.writer.shape._apply_shadow import _apply_shadow
from doe_export.pptx.writer.text._is_text_box import _is_text_box
from doe_export.pptx.writer.package._remove_presentation_shape_style import _remove_presentation_shape_style
from doe_export.pptx.writer.shape._shape_type import _shape_type

def _add_auto_shape(slide, shape: dict[str, Any], left, top, width, height, text_frame: dict[str, Any] | None):
    if _is_text_box(shape, text_frame):
        auto_shape = slide.shapes.add_textbox(left, top, width, height)
    else:
        auto_shape = slide.shapes.add_shape(_shape_type(shape.get("geometry")), left, top, width, height)
    if shape.get("rotation"):
        auto_shape.rotation = float(shape.get("rotation") or 0)
    _apply_fill(
        auto_shape,
        shape.get("fill"),
        slide=slide,
        effects=shape.get("effects"),
    )
    _apply_line(auto_shape, shape.get("border"))
    _apply_custom_geometry(auto_shape, shape)
    _apply_shadow(auto_shape, shape.get("shadow"))
    _remove_presentation_shape_style(auto_shape)
    return auto_shape

_add_auto_shape.__module__ = 'pptx2html.server.pptx_writer'
