# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._ext_from_content_type
from __future__ import annotations

@staticmethod
def _ext_from_content_type(ct: str) -> str:
    mapping = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
        "image/svg+xml": ".svg",
        "image/x-wmf": ".wmf",
        "image/x-emf": ".emf",
    }
    return mapping.get(ct, ".bin")

_ext_from_content_type.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_ext_from_content_type.__func__.__qualname__ = 'HtmlRenderer._ext_from_content_type'
