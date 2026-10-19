# Origin: pptx2html/server/ooxml_pptx_writer.py::image_extension
from __future__ import annotations

def image_extension(content_type: str) -> str:
    return {
        "image/png": "png",
        "image/jpeg": "jpeg",
        "image/jpg": "jpg",
        "image/gif": "gif",
        "image/svg+xml": "svg",
        "image/webp": "webp",
    }.get(content_type, "bin")

image_extension.__module__ = 'pptx2html.server.ooxml_pptx_writer'
