# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_identity
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def shape_identity(shape: dict[str, Any]) -> tuple[Any, Any, Any]:
    return (shape.get("shape_id"), shape.get("type"), shape.get("name"))

shape_identity.__module__ = 'pptx2html.server.ooxml_pptx_writer'
