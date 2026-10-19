# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_opacity
from __future__ import annotations

@classmethod
def _image_opacity(cls, image, multiplier: float | None = None) -> float:
    opacity = 1.0 if getattr(image, "alpha", None) is None else cls._finite_float(image.alpha)
    if multiplier is not None:
        opacity *= cls._finite_float(multiplier)
    return max(0.0, min(1.0, opacity))

_image_opacity.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_image_opacity.__func__.__qualname__ = 'HtmlRenderer._image_opacity'
