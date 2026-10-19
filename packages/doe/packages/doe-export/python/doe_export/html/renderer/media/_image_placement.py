# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_placement
from __future__ import annotations

@classmethod
def _image_placement(cls, image) -> tuple[float, float, float, float]:
    left, right, top, bottom = cls._normalized_crop(image)
    visible_w = max(0.001, 1.0 - left - right)
    visible_h = max(0.001, 1.0 - top - bottom)
    stretch_left = cls._finite_float(getattr(image, "stretch_left", None))
    stretch_right = cls._finite_float(getattr(image, "stretch_right", None))
    stretch_top = cls._finite_float(getattr(image, "stretch_top", None))
    stretch_bottom = cls._finite_float(getattr(image, "stretch_bottom", None))
    dest_w = max(0.001, 1.0 - stretch_left - stretch_right)
    dest_h = max(0.001, 1.0 - stretch_top - stretch_bottom)
    image_x = stretch_left - left / visible_w * dest_w
    image_y = stretch_top - top / visible_h * dest_h
    return image_x, image_y, dest_w / visible_w, dest_h / visible_h

_image_placement.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_image_placement.__func__.__qualname__ = 'HtmlRenderer._image_placement'
