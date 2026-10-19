# Origin: pptx2html/server/ooxml_pptx_writer.py::image_payload_changed
from __future__ import annotations
from doe_export.pptx.ooxml.shared import Any
from doe_export.pptx.ooxml.shape.shape_changed import shape_changed

def image_payload_changed(current: dict[str, Any], original: dict[str, Any]) -> bool:
    return shape_changed(
        {
            "data": current.get("data"),
            "url": current.get("url"),
            "content_type": current.get("content_type"),
        },
        {
            "data": original.get("data"),
            "url": original.get("url"),
            "content_type": original.get("content_type"),
        },
    )

image_payload_changed.__module__ = 'pptx2html.server.ooxml_pptx_writer'
