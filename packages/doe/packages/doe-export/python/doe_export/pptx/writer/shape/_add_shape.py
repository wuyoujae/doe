# Origin: pptx2html/server/pptx_writer.py::_add_shape
from __future__ import annotations
from doe_export.pptx.writer.shared import Any
from doe_export.pptx.writer.shared import Path
from doe_export.pptx.writer.shared import Pt, has_image_payload
from doe_export.pptx.writer.shape._add_auto_shape import _add_auto_shape
from doe_export.pptx.writer.xml._add_connector import _add_connector
from doe_export.pptx.writer.xml._add_icon import _add_icon
from doe_export.pptx.writer.xml._add_picture import _add_picture
from doe_export.pptx.writer.table._add_table import _add_table
from doe_export.pptx.writer.text._apply_text_frame import _apply_text_frame
from doe_export.pptx.writer.text._formula_text_frame import _formula_text_frame
from doe_export.pptx.writer.shape._register_exported_shape import _register_exported_shape
from doe_export.pptx.writer.text._shape_text_container_metrics import _shape_text_container_metrics

def _add_shape(
    slide,
    shape: dict[str, Any],
    temp_files: list[Path],
    offset_left: float = 0.0,
    offset_top: float = 0.0,
    shape_id_map: dict[int, int] | None = None,
) -> None:
    bounds = shape.get("bounds") or {}
    raw_left = offset_left + float(bounds.get("left") or 0)
    raw_top = offset_top + float(bounds.get("top") or 0)
    raw_width = float(bounds.get("width") or 1)
    raw_height = float(bounds.get("height") or 0)
    left = Pt(raw_left)
    top = Pt(raw_top)
    width = Pt(max(1.0, raw_width))
    height = Pt(max(1.0, raw_height))

    if shape.get("type") == "group_shape":
        for child in shape.get("shapes") or []:
            _add_shape(slide, child, temp_files, raw_left, raw_top, shape_id_map=shape_id_map)
        return
    if shape.get("table"):
        _register_exported_shape(shape_id_map, shape, _add_table(slide, shape, left, top, width, height))
        return
    if shape.get("type") == "picture" and has_image_payload(shape.get("image")):
        _register_exported_shape(shape_id_map, shape, _add_picture(slide, shape, left, top, width, height, temp_files))
        return
    if shape.get("type") == "connector" or shape.get("geometry") == "line":
        _register_exported_shape(shape_id_map, shape, _add_connector(slide, shape, raw_left, raw_top, raw_width, raw_height))
        return
    if shape.get("icon") and not shape.get("geometry_paths"):
        _register_exported_shape(shape_id_map, shape, _add_icon(slide, shape, left, top, width, height))
        return

    text_frame = shape.get("text")
    formula = shape.get("formula")
    if formula and not text_frame:
        text_frame = _formula_text_frame(formula)

    auto_shape = _add_auto_shape(slide, shape, left, top, width, height, text_frame)
    if text_frame:
        _apply_text_frame(
            auto_shape.text_frame,
            text_frame,
            container_metrics=_shape_text_container_metrics(shape, raw_width, raw_height),
        )
    _register_exported_shape(shape_id_map, shape, auto_shape)

_add_shape.__module__ = 'pptx2html.server.pptx_writer'
