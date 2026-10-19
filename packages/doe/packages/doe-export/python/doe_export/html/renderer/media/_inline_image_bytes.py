# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._inline_image_bytes
from __future__ import annotations
from doe_export.html.renderer.shared import base64

def _inline_image_bytes(self, image) -> bytes | None:
    data = str(getattr(image, "data", "") or "").strip()
    if data and not data.startswith(("yrkie-asset-", "data:")):
        try:
            return self._image_bytes(image)
        except Exception:
            return None
    source = data if data.startswith("data:") else str(getattr(image, "url", "") or "")
    if ";base64," not in source:
        return None
    try:
        return base64.b64decode(source.split(",", 1)[1], validate=True)
    except Exception:
        return None

_inline_image_bytes.__module__ = 'pptx2html.renderer.html_renderer'
_inline_image_bytes.__qualname__ = 'HtmlRenderer._inline_image_bytes'
