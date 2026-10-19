# Origin: pptx2html/server/ooxml_pptx_writer.py::shape_type_identity
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any

def shape_type_identity(shape: dict[str, Any]) -> tuple[Any, bool, bool]:
    return (shape.get("type"), bool(shape.get("table")), bool(shape.get("chart")))

shape_type_identity.__module__ = 'pptx2html.server.ooxml_pptx_writer'
