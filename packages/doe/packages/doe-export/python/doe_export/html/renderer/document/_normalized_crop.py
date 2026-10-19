# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._normalized_crop
from __future__ import annotations

@classmethod
def _normalized_crop(cls, image) -> tuple[float, float, float, float]:
    values = [
        max(0.0, min(1.0, cls._finite_float(getattr(image, name, None))))
        for name in ("crop_left", "crop_right", "crop_top", "crop_bottom")
    ]
    left, right, top, bottom = values
    if left + right >= 0.999:
        scale = 0.999 / max(0.001, left + right)
        left *= scale
        right *= scale
    if top + bottom >= 0.999:
        scale = 0.999 / max(0.001, top + bottom)
        top *= scale
        bottom *= scale
    return left, right, top, bottom

_normalized_crop.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_normalized_crop.__func__.__qualname__ = 'HtmlRenderer._normalized_crop'
