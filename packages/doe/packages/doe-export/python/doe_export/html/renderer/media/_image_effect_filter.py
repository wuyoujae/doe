# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_effect_filter
from __future__ import annotations

@classmethod
def _image_effect_filter(cls, image) -> str:
    grayscale = 0.0
    for effect in getattr(image, "effects", None) or []:
        if isinstance(effect, dict):
            effect_type = effect.get("type")
            amount = effect.get("alpha")
        else:
            effect_type = getattr(effect, "type", None)
            amount = getattr(effect, "alpha", None)
        if str(effect_type or "").lower() != "grayscale":
            continue
        grayscale = max(
            grayscale,
            1.0 if amount is None else max(0.0, min(1.0, cls._finite_float(amount))),
        )
    return f"grayscale({grayscale * 100.0:.6f}%)" if grayscale > 0 else ""

_image_effect_filter.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_image_effect_filter.__func__.__qualname__ = 'HtmlRenderer._image_effect_filter'
