# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_bytes
from __future__ import annotations
from doe_export.html.renderer.shared import base64, re

@staticmethod
def _image_bytes(image) -> bytes:
    raw = base64.b64decode(image.data)
    if str(getattr(image, "content_type", "")).lower() != "image/svg+xml":
        return raw
    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw
    match = re.search(r"<svg\b[^>]*>", source, flags=re.IGNORECASE)
    if not match or re.search(r"\bpreserveAspectRatio\s*=", match.group(0), flags=re.IGNORECASE):
        return raw
    root = match.group(0)[:-1] + ' preserveAspectRatio="none">'
    return (source[: match.start()] + root + source[match.end() :]).encode("utf-8")

_image_bytes.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_image_bytes.__func__.__qualname__ = 'HtmlRenderer._image_bytes'
