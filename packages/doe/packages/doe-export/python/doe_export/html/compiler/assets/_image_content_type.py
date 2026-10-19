# Origin: pptx2html/htmlir/compiler.py::_image_content_type
from __future__ import annotations

def _image_content_type(src: str) -> str:
    lower = src.split("?", 1)[0].lower()
    if lower.endswith(".jpg") or lower.endswith(".jpeg"):
        return "image/jpeg"
    if lower.endswith(".gif"):
        return "image/gif"
    if lower.endswith(".webp"):
        return "image/webp"
    if lower.startswith("data:image/"):
        return lower.split(";", 1)[0].removeprefix("data:")
    return "image/png"

_image_content_type.__module__ = 'pptx2html.htmlir.compiler'
