# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_style
from __future__ import annotations

@classmethod
def _image_style(cls, image) -> str:
    image_x, image_y, image_w, image_h = cls._image_placement(image)
    opacity = cls._image_opacity(image)
    effect_filter = cls._image_effect_filter(image)
    filter_style = f"filter:{effect_filter};" if effect_filter else ""
    return (
        "position:absolute;"
        f"left:{image_x * 100.0:.6f}%;top:{image_y * 100.0:.6f}%;"
        f"width:{image_w * 100.0:.6f}%;height:{image_h * 100.0:.6f}%;"
        f"opacity:{opacity:.6f};{filter_style}display:block;max-width:none;max-height:none;"
    )

_image_style.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_image_style.__func__.__qualname__ = 'HtmlRenderer._image_style'
