# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_ids_from_ir
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def shape_ids_from_ir(shapes: list[dict[str, Any]]) -> set[int]:
    result: set[int] = set()
    for shape in shapes:
        shape_id = shape.get("shape_id")
        if isinstance(shape_id, int):
            result.add(shape_id)
        result.update(shape_ids_from_ir(shape.get("shapes") or []))
    return result

shape_ids_from_ir.__module__ = 'pptx2html.server.ooxml_pptx_writer'
