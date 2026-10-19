# Origin: pptx2html/server/pptx_writer.py::_register_exported_shape
from __future__ import annotations
from doe_export.pptx.writer.shared import Any

def _register_exported_shape(shape_id_map: dict[int, int] | None, shape: dict[str, Any], pptx_shape) -> None:
    if shape_id_map is None or pptx_shape is None:
        return
    try:
        ir_shape_id = int(shape.get("shape_id"))
        pptx_shape_id = int(pptx_shape.shape_id)
    except (TypeError, ValueError, AttributeError):
        return
    shape_id_map[ir_shape_id] = pptx_shape_id

_register_exported_shape.__module__ = 'pptx2html.server.pptx_writer'
