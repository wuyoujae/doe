# Origin: pptx2html/server/pptx_writer.py::_image_suffix
from __future__ import annotations

def _image_suffix(content_type: str | None) -> str:
    return {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
    }.get(content_type or "", ".img")

_image_suffix.__module__ = 'pptx2html.server.pptx_writer'
