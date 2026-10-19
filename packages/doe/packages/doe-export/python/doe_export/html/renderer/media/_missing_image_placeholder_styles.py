# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._missing_image_placeholder_styles
from __future__ import annotations

@staticmethod
def _missing_image_placeholder_styles() -> list[str]:
    return [
        "position:absolute",
        "inset:0",
        "background-color:#f4f6fb",
        (
            "background-image:"
            "linear-gradient(45deg,transparent 48%,#cbd5e1 48%,#cbd5e1 52%,transparent 52%),"
            "linear-gradient(-45deg,transparent 48%,#cbd5e1 48%,#cbd5e1 52%,transparent 52%)"
        ),
        "background-position:center",
        "background-repeat:no-repeat",
        "background-size:24pt 24pt",
    ]

_missing_image_placeholder_styles.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_missing_image_placeholder_styles.__func__.__qualname__ = 'HtmlRenderer._missing_image_placeholder_styles'
