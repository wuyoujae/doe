# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._image_svg_document
from __future__ import annotations

def _image_svg_document(
    self,
    image,
    width_pt: float,
    height_pt: float,
    *,
    opacity_multiplier: float | None = None,
    source: str | None = None,
) -> str:
    pattern_id = "pptx-image-pattern"
    pattern = self._image_pattern_definition(
        image,
        pattern_id,
        width_pt,
        height_pt,
        opacity_multiplier=opacity_multiplier,
        source=source,
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
        'preserveAspectRatio="none">'
        f'<defs>{pattern}</defs>'
        f'<rect x="0" y="0" width="100" height="100" fill="url(#{pattern_id})"/>'
        '</svg>'
    )

_image_svg_document.__module__ = 'pptx2html.renderer.html_renderer'
_image_svg_document.__qualname__ = 'HtmlRenderer._image_svg_document'
